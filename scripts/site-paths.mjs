import path from "node:path";

function normalizeBasePath(value) {
  const raw = `${value ?? ""}`.trim();

  if (!raw || raw === "." || raw === "./") {
    return "./";
  }

  const cleaned = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  return `/${cleaned}/`;
}

export function resolvePublicBasePath(env = process.env) {
  return normalizeBasePath(env.OURCORE_BASE_PATH ?? env.VITE_BASE_PATH ?? "./");
}

export function resolveSiteMirrorDir(env = process.env, cwd = process.cwd()) {
  const siteRoot = `${env.OURCORE_SITE_ROOT ?? env.OURCORE_SITE_DIR ?? ""}`.trim();
  if (siteRoot) {
    return path.resolve(siteRoot, "OC");
  }

  return path.resolve(cwd, "..", "koraytasancom", "OC");
}

export { normalizeBasePath };
