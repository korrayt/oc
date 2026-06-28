import test from "node:test";
import assert from "node:assert/strict";
import {
  isWebDemoRuntime,
  resolveProductEnabledForRuntime,
  resolveLicenseStatusForRuntime,
} from "../src/license-runtime.mjs";

test("web runtime uses the demo license path", () => {
  assert.equal(isWebDemoRuntime(false), true);
  assert.equal(resolveLicenseStatusForRuntime("missing", false), "valid");
});

test("tauri runtime keeps the stored license values", () => {
  assert.equal(isWebDemoRuntime(true), false);
  assert.equal(resolveLicenseStatusForRuntime("restricted", true), "restricted");
});

test("web runtime keeps the product shell open", () => {
  assert.equal(resolveProductEnabledForRuntime(false, false), true);
  assert.equal(resolveProductEnabledForRuntime(true, false), true);
  assert.equal(resolveProductEnabledForRuntime(false, true), false);
});
