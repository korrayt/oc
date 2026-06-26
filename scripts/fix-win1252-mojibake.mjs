import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targets = [
  "src/App.tsx",
  "src/App.css",
  "README.md",
  "ROADMAP.md",
  "MIMARI_NOTLAR.md",
  "ONLINE_HOST_SETUP.md",
  "legal/EULA.md",
  "legal/PRIVACY_NOTICE.md",
  "legal/TELEMETRY_CONSENT.md",
  "legal/THIRD_PARTY_LICENSES.md",
];

const cp1252ToByte = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const suspiciousPattern = /[\u00c3\u00c4\u00c5\u0153\u0178\u2013\u2021\u20ac]/g;

function countSuspicious(text) {
  return (text.match(suspiciousPattern) || []).length;
}

function fixOnce(text) {
  const bytes = [];

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;

    if (cp <= 0xff) {
      bytes.push(cp);
      continue;
    }

    const mappedByte = cp1252ToByte.get(cp);
    if (mappedByte !== undefined) {
      bytes.push(mappedByte);
      continue;
    }

    bytes.push(...Buffer.from(ch, "utf8"));
  }

  return Buffer.from(bytes).toString("utf8");
}

function fixMojibake(text) {
  let current = text;
  for (let i = 0; i < 3; i += 1) {
    const next = fixOnce(current);
    if (next === current) break;

    const currentSuspicious = countSuspicious(current);
    const nextSuspicious = countSuspicious(next);
    if (nextSuspicious >= currentSuspicious) break;

    current = next;
  }

  return current;
}

const updated = [];

for (const relativePath of targets) {
  const fullPath = path.join(rootDir, relativePath);
  const before = await readFile(fullPath, "utf8");
  const after = fixMojibake(before);

  if (after !== before) {
    await writeFile(fullPath, after, "utf8");
    updated.push(relativePath);
  }
}

if (updated.length === 0) {
  console.log("No win1252 mojibake detected.");
} else {
  console.log("Updated files:");
  for (const file of updated) {
    console.log(`- ${file}`);
  }
}
