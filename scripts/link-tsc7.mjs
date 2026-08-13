// Prefer TypeScript 7 native `tsc` on PATH for Next.js CLI typechecking while
// keeping the `typescript` package as TS 6 for tools that need the JS API.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = process.cwd();
const binDir = path.join(appRoot, "node_modules", ".bin");
const candidates = [
  path.join(appRoot, "node_modules", "@typescript", "native", "bin", "tsc"),
  path.join(appRoot, "node_modules", "@typescript", "native", "lib", "tsc.js"),
];

const target = candidates.find((p) => fs.existsSync(p));
if (!target) {
  console.warn("[link-tsc7] @typescript/native tsc not found; skipping");
  process.exit(0);
}

fs.mkdirSync(binDir, { recursive: true });
const linkPath = path.join(binDir, "tsc");
try {
  fs.rmSync(linkPath, { force: true });
} catch {}
// Use absolute path wrapper script so it works cross-platform-ish in CI
const wrapper = `#!/usr/bin/env node
require(${JSON.stringify(target.endsWith(".js") ? target : target)});
`;
// If target is a binary (not js), spawn it
if (target.endsWith("tsc") && !target.endsWith(".js")) {
  const sh = `#!/bin/sh\nexec ${JSON.stringify(target)} "$@"\n`;
  fs.writeFileSync(linkPath, sh, { mode: 0o755 });
} else {
  fs.writeFileSync(linkPath, wrapper, { mode: 0o755 });
}
console.log("[link-tsc7] linked node_modules/.bin/tsc ->", target);
