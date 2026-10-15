#!/usr/bin/env node
// Creates a ready-to-code project folder with Git set up.
// Usage:  node odin-new-project.js my-project [--jest]
// Run it from inside your odin folder. Needs Node 14+ and Git installed.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const jest = args.includes("--jest");

if (!name || !/^[\w.-]+$/.test(name)) {
  console.log('Usage: node odin-new-project.js my-project [--jest]\nUse letters, numbers, - or _ (no spaces).');
  process.exit(1);
}
const dir = path.resolve(name);
if (fs.existsSync(dir)) {
  console.log(`"${name}" already exists. Pick a different name.`);
  process.exit(1);
}
fs.mkdirSync(dir);
const title = name.replace(/[-_]+/g, " ");
const files = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>${title}</h1>
  <script src="script.js"></script>
</body>
</html>
`,
  "style.css": `*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; }\n`,
  "script.js": `console.log("${title} is running");\n`,
  "README.md": `# ${title}\n\nA project from The Odin Project.\n\n## What I'm building\n\n## What I learned\n`,
  ".gitignore": `node_modules/\n.DS_Store\n`,
};
if (jest) {
  files["package.json"] = JSON.stringify(
    { name, version: "1.0.0", scripts: { test: "jest" }, devDependencies: { jest: "^29.7.0" } },
    null, 2) + "\n";
  files["sum.js"] = `function sum(a, b) {\n  return a + b;\n}\nmodule.exports = sum;\n`;
  files["sum.test.js"] = `const sum = require("./sum");\n\ntest("adds 1 + 2 to equal 3", () => {\n  expect(sum(1, 2)).toBe(3);\n});\n`;
}
for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), text);

try {
  execSync("git init", { cwd: dir, stdio: "ignore" });
  execSync("git add .", { cwd: dir, stdio: "ignore" });
  execSync('git commit -m "Initial project setup"', { cwd: dir, stdio: "ignore" });
  console.log("✔ Git repo created with a first commit.");
} catch (e) {
  console.log("Folder made, but Git didn't finish. Is Git installed and your name/email set?");
}
console.log(`\n✔ Created ${name}/ with: ${Object.keys(files).join(", ")}`);
console.log(`\nNext:\n  cd ${name}\n  code .${jest ? "\n  npm install\n  npm test" : ""}`);
console.log("\nWhen you're ready to share it, create an empty repo on GitHub and follow its push instructions.");
