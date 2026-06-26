import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targets = [
  "src/App.tsx",
  "scripts/core-host-api.mjs",
  "README.md",
  "ROADMAP.md",
  "MIMARI_NOTLAR.md",
  "ONLINE_HOST_SETUP.md",
  "legal/EULA.md",
  "legal/PRIVACY_NOTICE.md",
  "legal/TELEMETRY_CONSENT.md",
  "legal/THIRD_PARTY_LICENSES.md",
];

const replacements = [
  ["Ã„Â°", "İ"],
  ["Ã„Â±", "ı"],
  ["Ã…Åž", "Ş"],
  ["Ã…ÅŸ", "ş"],
  ["Ã„Åž", "Ğ"],
  ["Ã„ÅŸ", "ğ"],
  ["Ãƒâ€“", "Ö"],
  ["ÃƒÂ¶", "ö"],
  ["ÃƒÅ“", "Ü"],
  ["ÃƒÂ¼", "ü"],
  ["Ãƒâ€¡", "Ç"],
  ["ÃƒÂ§", "ç"],
  ["Ã¢â‚¬Â¢", "•"],
  ["Ã¢â‚¬â€œ", "–"],
  ["Ã¢â‚¬â€", "-"],
  ["Ã¢â‚¬Å“", "\""],
  ["Ã¢â‚¬Â", "\""],
  ["Ã¢â‚¬â„¢", "'"],
  ["Ã¢â‚¬Ëœ", "'"],
  ["Ä°", "İ"],
  ["Ä±", "ı"],
  ["Åž", "Ş"],
  ["ÅŸ", "ş"],
  ["ÄŸ", "ğ"],
  ["Äž", "Ğ"],
  ["Ã–", "Ö"],
  ["Ã¶", "ö"],
  ["Ãœ", "Ü"],
  ["Ã¼", "ü"],
  ["Ã‡", "Ç"],
  ["Ã§", "ç"],
  ["Ã¢â‚¬Â¦", "..."],
  ["â€œ", "\""],
  ["â€", "\""],
  ["â€˜", "'"],
  ["â€™", "'"],
  ["â€¢", "•"],
  ["â€“", "–"],
  ["â€”", "-"],
];

function fixMojibake(input) {
  let output = input;
  let changed = true;

  while (changed) {
    changed = false;
    for (const [from, to] of replacements) {
      if (output.includes(from)) {
        output = output.split(from).join(to);
        changed = true;
      }
    }
  }

  return output;
}

const updates = [];

for (const relativePath of targets) {
  const filePath = path.join(rootDir, relativePath);
  const current = await readFile(filePath, "utf8");
  const fixed = fixMojibake(current);

  if (fixed !== current) {
    await writeFile(filePath, fixed, "utf8");
    updates.push(relativePath);
  }
}

if (updates.length === 0) {
  console.log("No mojibake sequences found.");
} else {
  console.log("Fixed files:");
  for (const file of updates) {
    console.log(`- ${file}`);
  }
}
