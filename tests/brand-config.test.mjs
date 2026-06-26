import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = path.join(rootDir, "package.json");
const tauriConfigPath = path.join(rootDir, "src-tauri", "tauri.conf.json");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const tauriConfig = JSON.parse(await readFile(tauriConfigPath, "utf8"));

test("package name is oc", () => {
  assert.equal(packageJson.name, "oc");
});

test("desktop product name is OC", () => {
  assert.equal(tauriConfig.productName, "OC");
});

test("desktop identifier matches the OurCore brand", () => {
  assert.equal(tauriConfig.identifier, "com.ourcore.oc");
});
