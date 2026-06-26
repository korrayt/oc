import { mkdir, cp, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { resolveSiteMirrorDir } from "./site-paths.mjs";

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, "dist");
const mirrorDir = resolveSiteMirrorDir(process.env, rootDir);

await rm(mirrorDir, { recursive: true, force: true });
await mkdir(path.dirname(mirrorDir), { recursive: true });
await cp(distDir, mirrorDir, { recursive: true });

console.log(`Synced ${distDir} -> ${mirrorDir}`);
