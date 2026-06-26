import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { resolvePublicBasePath } from "../scripts/site-paths.mjs";
import { resolveSiteMirrorDir } from "../scripts/site-paths.mjs";

test("defaults to a relative base path for subpath hosting", () => {
  assert.equal(resolvePublicBasePath({}), "./");
});

test("normalizes an explicit OC base path", () => {
  assert.equal(resolvePublicBasePath({ OURCORE_BASE_PATH: "OC" }), "/OC/");
});

test("defaults to the local koraytasancom OC mirror", () => {
  assert.equal(
    resolveSiteMirrorDir({}, "E:/CODEX/oc"),
    path.resolve("E:/CODEX/oc", "..", "koraytasancom", "OC")
  );
});

test("honors an explicit site root", () => {
  assert.equal(
    resolveSiteMirrorDir({ OURCORE_SITE_ROOT: "E:/Sites/Koray" }),
    path.resolve("E:/Sites/Koray", "OC")
  );
});
