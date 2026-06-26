#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Utc;
use once_cell::sync::Lazy;
use rand::Rng;
use serde::Serialize;
use std::collections::HashMap;
use std::env;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use url::Url;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TerminalResponse {
    command: String,
    stdout: String,
    stderr: String,
    status_code: i32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GitPackagePullResponse {
    repo_url: String,
    package_name: String,
    branch: String,
    destination_path: String,
    stdout: String,
    stderr: String,
    status_code: i32,
}

#[derive(Clone)]
struct PendingDownloadRequest {
    request_id: String,
    url: String,
    source_domain: String,
    file_name: String,
    suggested_path: String,
    referer: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadAuditRecord {
    id: String,
    request_id: String,
    at: String,
    source_domain: String,
    file_name: String,
    url: String,
    target_path: String,
    result: String,
    note: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadPrepareResponse {
    request_id: String,
    url: String,
    source_domain: String,
    file_name: String,
    extension: String,
    suggested_path: String,
    created_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadExecutionResponse {
    request_id: String,
    url: String,
    target_path: String,
    status_code: i32,
    bytes_written: u64,
    completed_at: String,
}

static DOWNLOAD_REQUESTS: Lazy<Mutex<HashMap<String, PendingDownloadRequest>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
static DOWNLOAD_AUDIT: Lazy<Mutex<Vec<DownloadAuditRecord>>> = Lazy::new(|| Mutex::new(Vec::new()));

fn is_blocked_command(command: &str) -> bool {
    let lowered = command.to_lowercase();
    let blocked_patterns = [
        "format ",
        " shutdown",
        " stop-computer",
        " restart-computer",
        " remove-item ",
        " rm -rf",
        " rmdir /s",
        " del /s",
    ];

    blocked_patterns
        .iter()
        .any(|pattern| lowered.contains(pattern))
}

fn is_safe_repo_segment(value: &str) -> bool {
    !value.is_empty()
        && value
            .chars()
            .all(|character| character.is_alphanumeric() || matches!(character, '-' | '_' | '.'))
}

fn parse_github_repo(repo_input: &str) -> Result<(String, String, String), String> {
    let trimmed = repo_input.trim();
    if trimmed.is_empty() {
        return Err("Repo URL bos olamaz.".into());
    }

    let lower = trimmed.to_lowercase();
    let tail = if lower.contains("://") {
        let marker = "github.com/";
        let marker_index = lower
            .find(marker)
            .ok_or_else(|| "Su an yalnizca github.com kaynaklari destekleniyor.".to_string())?;
        &trimmed[(marker_index + marker.len())..]
    } else {
        trimmed
    };

    let no_query = tail.split('?').next().unwrap_or(tail);
    let no_hash = no_query.split('#').next().unwrap_or(no_query);
    let mut normalized = no_hash.trim().trim_matches('/').to_string();
    if normalized.ends_with(".git") {
        normalized.truncate(normalized.len().saturating_sub(4));
    }

    let parts: Vec<&str> = normalized.split('/').filter(|segment| !segment.is_empty()).collect();
    if parts.len() < 2 {
        return Err("Repo adresi owner/repo formatinda olmali.".into());
    }

    let owner = parts[0].to_string();
    let repo = parts[1].to_string();

    if !is_safe_repo_segment(&owner) || !is_safe_repo_segment(&repo) {
        return Err("Repo adresinde gecersiz karakter var.".into());
    }

    Ok((
        owner.clone(),
        repo.clone(),
        format!("https://github.com/{}/{}.git", owner, repo),
    ))
}

fn sanitize_package_name(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut previous_dash = false;

    for character in value.chars() {
        let safe = if character.is_ascii_alphanumeric() {
            previous_dash = false;
            Some(character.to_ascii_lowercase())
        } else if matches!(character, '-' | '_' | '.') {
            previous_dash = false;
            Some(character)
        } else if previous_dash {
            None
        } else {
            previous_dash = true;
            Some('-')
        };

        if let Some(safe_character) = safe {
            output.push(safe_character);
        }
    }

    let trimmed = output.trim_matches('-').trim_matches('.');
    if trimmed.is_empty() {
        "github-package".to_string()
    } else {
        trimmed.to_string()
    }
}

fn is_safe_branch(branch: &str) -> bool {
    !branch.is_empty()
        && branch
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '/' | '-' | '_' | '.'))
}

fn resolve_library_pool_dir() -> Result<PathBuf, String> {
    if let Ok(custom) = env::var("COREI_LIBRARY_POOL_DIR") {
        let clean = custom.trim();
        if !clean.is_empty() {
            let path = PathBuf::from(clean);
            fs::create_dir_all(&path).map_err(|error| format!("Hedef klasor olusturulamadi: {error}"))?;
            return Ok(path);
        }
    }

    if cfg!(target_os = "windows") {
        if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
            let path = PathBuf::from(local_app_data).join("OC").join("library-pool");
            fs::create_dir_all(&path).map_err(|error| format!("Hedef klasor olusturulamadi: {error}"))?;
            return Ok(path);
        }
    }

    if let Ok(home) = env::var("HOME") {
        let path = PathBuf::from(home).join(".core-i").join("library-pool");
        fs::create_dir_all(&path).map_err(|error| format!("Hedef klasor olusturulamadi: {error}"))?;
        return Ok(path);
    }

    let fallback = env::current_dir()
        .map_err(|error| format!("Calisma klasoru alinamadi: {error}"))?
        .join("library-pool");
    fs::create_dir_all(&fallback).map_err(|error| format!("Hedef klasor olusturulamadi: {error}"))?;
    Ok(fallback)
}

fn now_rfc3339() -> String {
    Utc::now().to_rfc3339()
}

fn create_download_request_id() -> String {
    let random = rand::thread_rng().gen_range(100000..999999);
    format!("download-{random}-{}", Utc::now().timestamp_millis())
}

fn create_download_audit_id() -> String {
    let random = rand::thread_rng().gen_range(100000..999999);
    format!("audit-{random}-{}", Utc::now().timestamp_millis())
}

fn sanitize_download_file_name(raw_name: &str) -> String {
    let mut output = String::new();
    for character in raw_name.chars() {
        if character.is_ascii_alphanumeric() || matches!(character, '.' | '_' | '-') {
            output.push(character);
        } else if output.ends_with('-') {
            continue;
        } else {
            output.push('-');
        }
    }

    let cleaned = output.trim_matches('-').trim_matches('.');
    if cleaned.is_empty() {
        "download.bin".to_string()
    } else {
        cleaned.to_string()
    }
}

fn resolve_download_storage_dir() -> Result<PathBuf, String> {
    if let Ok(custom) = env::var("COREI_DOWNLOAD_DIR") {
        let clean = custom.trim();
        if !clean.is_empty() {
            let path = PathBuf::from(clean);
            fs::create_dir_all(&path).map_err(|error| format!("Download klasoru olusturulamadi: {error}"))?;
            return Ok(path);
        }
    }

    if cfg!(target_os = "windows") {
        if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
            let path = PathBuf::from(local_app_data).join("OC").join("downloads");
            fs::create_dir_all(&path).map_err(|error| format!("Download klasoru olusturulamadi: {error}"))?;
            return Ok(path);
        }
    }

    if let Ok(home) = env::var("HOME") {
        let path = PathBuf::from(home).join(".core-i").join("downloads");
        fs::create_dir_all(&path).map_err(|error| format!("Download klasoru olusturulamadi: {error}"))?;
        return Ok(path);
    }

    let fallback = env::current_dir()
        .map_err(|error| format!("Calisma klasoru alinamadi: {error}"))?
        .join("downloads");
    fs::create_dir_all(&fallback).map_err(|error| format!("Download klasoru olusturulamadi: {error}"))?;
    Ok(fallback)
}

fn extract_file_name_from_url(parsed_url: &Url) -> String {
    let path = parsed_url.path();
    let last_segment = path.rsplit('/').next().unwrap_or("").trim();
    if last_segment.is_empty() {
        "download.bin".to_string()
    } else {
        sanitize_download_file_name(last_segment)
    }
}

fn extract_extension(file_name: &str) -> String {
    file_name
        .rsplit_once('.')
        .and_then(|(_, value)| {
            let clean = value.trim().to_lowercase();
            if clean.is_empty() {
                None
            } else {
                Some(clean)
            }
        })
        .unwrap_or_else(|| "bin".to_string())
}

fn push_download_audit(record: DownloadAuditRecord) {
    if let Ok(mut list) = DOWNLOAD_AUDIT.lock() {
        list.insert(0, record);
        if list.len() > 300 {
            list.truncate(300);
        }
    }
}

#[tauri::command]
fn run_core_terminal(command: String) -> Result<TerminalResponse, String> {
    let trimmed = command.trim();
    if trimmed.is_empty() {
        return Err("Komut bos olamaz.".into());
    }

    if is_blocked_command(trimmed) {
        return Err("Bu komut guvenlik nedeniyle engellendi.".into());
    }

    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", trimmed])
            .output()
            .map_err(|error| format!("Komut calistirilamadi: {error}"))?
    } else {
        Command::new("sh")
            .args(["-c", trimmed])
            .output()
            .map_err(|error| format!("Komut calistirilamadi: {error}"))?
    };

    Ok(TerminalResponse {
        command: trimmed.to_string(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        status_code: output.status.code().unwrap_or(-1),
    })
}

#[tauri::command]
fn pull_github_package(
    repo_url: String,
    branch: Option<String>,
    target_name: Option<String>,
) -> Result<GitPackagePullResponse, String> {
    let (owner, repo, normalized_repo_url) = parse_github_repo(&repo_url)?;
    let branch_value = branch
        .unwrap_or_default()
        .trim()
        .to_string();

    if !branch_value.is_empty() && !is_safe_branch(&branch_value) {
        return Err("Branch/ref degerinde gecersiz karakter var.".into());
    }

    let preferred_name = target_name.unwrap_or_default();
    let package_name = if preferred_name.trim().is_empty() {
        sanitize_package_name(&format!("{owner}-{repo}"))
    } else {
        sanitize_package_name(&preferred_name)
    };

    let base_dir = resolve_library_pool_dir()?;
    let destination_path = base_dir.join(&package_name);

    if destination_path.exists() {
        return Err(format!(
            "Hedef klasor zaten var: {}. Farkli bir paket adi kullan.",
            destination_path.display()
        ));
    }

    let git_check = Command::new("git")
        .arg("--version")
        .output()
        .map_err(|_| "Git komutu bulunamadi. Git for Windows kurulu olmalidir.".to_string())?;
    if !git_check.status.success() {
        return Err("Git komutu calismiyor. Git kurulumu kontrol edilmeli.".into());
    }

    let mut clone_command = Command::new("git");
    clone_command.arg("clone").arg("--depth").arg("1");
    if !branch_value.is_empty() {
        clone_command.arg("--branch").arg(&branch_value);
    }
    clone_command.arg(&normalized_repo_url).arg(&destination_path);

    let clone_output = clone_command
        .output()
        .map_err(|error| format!("Git clone calistirilamadi: {error}"))?;

    let status_code: i32 = clone_output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&clone_output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&clone_output.stderr).to_string();

    if !clone_output.status.success() {
        return Err(format!(
            "GitHub paketi cekilemedi (kod: {status_code}). {}",
            if stderr.trim().is_empty() {
                "Git cikti detayini kontrol et."
            } else {
                stderr.trim()
            }
        ));
    }

    Ok(GitPackagePullResponse {
        repo_url: normalized_repo_url,
        package_name,
        branch: if branch_value.is_empty() {
            "default".to_string()
        } else {
            branch_value
        },
        destination_path: destination_path.to_string_lossy().to_string(),
        stdout,
        stderr,
        status_code,
    })
}

#[tauri::command]
fn prepare_download_request(
    url: String,
    referer: Option<String>,
) -> Result<DownloadPrepareResponse, String> {
    let clean_url = url.trim();
    if clean_url.is_empty() {
        return Err("Download URL bos olamaz.".into());
    }

    let parsed_url = Url::parse(clean_url).map_err(|_| "Download URL gecersiz.".to_string())?;
    let scheme = parsed_url.scheme().to_lowercase();
    if scheme != "http" && scheme != "https" {
        return Err("Yalnizca http/https URL destekleniyor.".into());
    }

    let source_domain = parsed_url
        .host_str()
        .map(|value| value.to_string())
        .ok_or_else(|| "Kaynak domain okunamadi.".to_string())?;
    let file_name = extract_file_name_from_url(&parsed_url);
    let extension = extract_extension(&file_name);
    let request_id = create_download_request_id();
    let created_at = now_rfc3339();

    let target_dir = resolve_download_storage_dir()?;
    let suggested_path = target_dir.join(&file_name);
    let suggested_path_text = suggested_path.to_string_lossy().to_string();

    let request = PendingDownloadRequest {
        request_id: request_id.clone(),
        url: parsed_url.to_string(),
        source_domain: source_domain.clone(),
        file_name: file_name.clone(),
        suggested_path: suggested_path_text.clone(),
        referer: referer.map(|value| value.trim().to_string()).filter(|value| !value.is_empty()),
    };

    let mut queue = DOWNLOAD_REQUESTS
        .lock()
        .map_err(|_| "Download kuyruÄŸu kilidi alÄ±namadÄ±.".to_string())?;
    queue.insert(request_id.clone(), request);

    Ok(DownloadPrepareResponse {
        request_id,
        url: parsed_url.to_string(),
        source_domain,
        file_name,
        extension,
        suggested_path: suggested_path_text,
        created_at,
    })
}

#[tauri::command]
fn approve_and_download(
    request_id: String,
    target_path: String,
) -> Result<DownloadExecutionResponse, String> {
    let clean_request_id = request_id.trim();
    if clean_request_id.is_empty() {
        return Err("request_id bos olamaz.".into());
    }

    let clean_target_path = target_path.trim();
    if clean_target_path.is_empty() {
        return Err("Hedef dosya yolu bos olamaz.".into());
    }

    let request = {
        let mut queue = DOWNLOAD_REQUESTS
            .lock()
            .map_err(|_| "Download kuyruÄŸu kilidi alÄ±namadÄ±.".to_string())?;
        queue
            .remove(clean_request_id)
            .ok_or_else(|| "Download istegi bulunamadi veya suresi doldu.".to_string())?
    };

    let target = PathBuf::from(clean_target_path);
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("Hedef klasor olusturulamadi: {error}"))?;
    }

    let mut req = ureq::get(&request.url).set("User-Agent", "OC/0.1-alpha");
    if let Some(referer) = request.referer.as_ref() {
        if !referer.is_empty() {
            req = req.set("Referer", referer);
        }
    }

    let response = req
        .call()
        .map_err(|error| format!("Dosya indirilemedi: {error}"))?;
    let status_code = i32::from(response.status());
    let mut reader = response.into_reader();

    let mut output = fs::File::create(&target)
        .map_err(|error| format!("Hedef dosya olusturulamadi: {error}"))?;
    let mut buffer = [0_u8; 8 * 1024];
    let mut bytes_written: u64 = 0;

    loop {
        let read_count = reader
            .read(&mut buffer)
            .map_err(|error| format!("Download okuma hatasi: {error}"))?;
        if read_count == 0 {
            break;
        }
        output
            .write_all(&buffer[..read_count])
            .map_err(|error| format!("Download yazma hatasi: {error}"))?;
        bytes_written += read_count as u64;
    }

    let completed_at = now_rfc3339();
    push_download_audit(DownloadAuditRecord {
        id: create_download_audit_id(),
        request_id: request.request_id.clone(),
        at: completed_at.clone(),
        source_domain: request.source_domain,
        file_name: request.file_name,
        url: request.url.clone(),
        target_path: target.to_string_lossy().to_string(),
        result: "completed".to_string(),
        note: format!("Download tamamlandi ({} byte).", bytes_written),
    });

    Ok(DownloadExecutionResponse {
        request_id: request.request_id,
        url: request.url,
        target_path: target.to_string_lossy().to_string(),
        status_code,
        bytes_written,
        completed_at,
    })
}

#[tauri::command]
fn cancel_download_request(request_id: String) -> Result<(), String> {
    let clean_request_id = request_id.trim();
    if clean_request_id.is_empty() {
        return Err("request_id bos olamaz.".into());
    }

    let removed = {
        let mut queue = DOWNLOAD_REQUESTS
            .lock()
            .map_err(|_| "Download kuyruÄŸu kilidi alÄ±namadÄ±.".to_string())?;
        queue.remove(clean_request_id)
    };

    if let Some(request) = removed {
        push_download_audit(DownloadAuditRecord {
            id: create_download_audit_id(),
            request_id: request.request_id,
            at: now_rfc3339(),
            source_domain: request.source_domain,
            file_name: request.file_name,
            url: request.url,
            target_path: request.suggested_path,
            result: "rejected".to_string(),
            note: "Download istegi kullanici tarafindan iptal edildi.".to_string(),
        });
    }

    Ok(())
}

#[tauri::command]
fn list_download_audit() -> Result<Vec<DownloadAuditRecord>, String> {
    let list = DOWNLOAD_AUDIT
        .lock()
        .map_err(|_| "Download audit kilidi alÄ±namadÄ±.".to_string())?;
    Ok(list.clone())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_core_terminal,
            pull_github_package,
            prepare_download_request,
            approve_and_download,
            cancel_download_request,
            list_download_audit
        ])
        .run(tauri::generate_context!())
        .expect("error while running OC");
}

