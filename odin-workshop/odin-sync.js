#!/usr/bin/env node
// Scans your odin folder for Git projects and writes odin-sync.json for the Workbench to import.
// Usage:  node odin-sync.js [odinFolder]     (defaults to the current folder)
// Reads only commit dates, counts and remote URLs. Nothing is uploaded anywhere.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(process.argv[2] || ".");
const MATCH = [
  [/recipe/i, "f6"], [/landing/i, "f7"], [/rock|rps/i, "f9"], [/etch|sketch/i, "f10"],
  [/calculator/i, "f11"], [/sign-?up/i, "g2"], [/library|to-?do/i, "g5"],
  [/weather/i, "g7"], [/members/i, "h4"],
];
const git = (cwd, cmd) =>
  execSync("git " + cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const projects = [];
const days = {};
for (const e of fs.readdirSync(root, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
  const dir = path.join(root, e.name);
  if (!fs.existsSync(path.join(dir, ".git"))) continue;

  let dates = [];
  try { dates = git(dir, "log --pretty=format:%ad --date=short").split("\n").filter(Boolean); } catch (_) {}
  let remote = "";
  try {
    remote = git(dir, "remote get-url origin")
      .replace(/^git@([^:]+):/, "https://$1/")
      .replace(/\.git$/, "")
      .replace(/\/\/[^@/]+@/, "//"); // strip any embedded credentials
  } catch (_) {}

  dates.forEach((d) => (days[d] = (days[d] || 0) + 1));
  const sorted = [...dates].sort();
  const hit = MATCH.find(([re]) => re.test(e.name));
  projects.push({
    name: e.name,
    commits: dates.length,
    first: sorted[0] || "",
    last: sorted[sorted.length - 1] || "",
    remote,
    match: hit ? hit[1] : "",
  });
}

const out = { generated: new Date().toISOString(), projects, days };
fs.writeFileSync(path.join(root, "odin-sync.json"), JSON.stringify(out, null, 2));

if (!projects.length) {
  console.log(`No Git projects found in ${root}. Run this from your odin folder, or pass its path.`);
} else {
  console.log(`✔ Found ${projects.length} project(s), ${Object.keys(days).length} days with commits:`);
  projects.forEach((p) => console.log(`  ${p.name}: ${p.commits} commits, last on ${p.last || "n/a"}`));
  console.log("\nNow open the Workbench, go to the Git sync tab and choose odin-sync.json.");
}
