#!/usr/bin/env node
// Runs your project's tests and, if they fail, asks your local Ollama model for a HINT (not the fix).
// Usage:  node odin-test-coach.js [projectFolder] [--watch] [--cmd "npx jest"]
// Needs Node 18+ and Ollama running. Optional env vars: OLLAMA_URL, OLLAMA_MODEL.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const dir = path.resolve(args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--cmd") || ".");
const cmd = val("--cmd") || "npx jest";
const url = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, "");
const model = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

async function runOnce() {
  console.log(`\n▶ ${cmd}  (in ${dir})`);
  const r = spawnSync(cmd, { cwd: dir, shell: true, encoding: "utf8" });
  const out = ((r.stdout || "") + (r.stderr || "")).trim();
  if (r.status === 0) return console.log("✔ All tests pass. Nice work.");
  console.log(out.slice(-1500));
  console.log("\n… asking the coach for a hint");
  try {
    const res = await fetch(url + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: "You are a patient tutor for a beginner learning JavaScript with The Odin Project. Explain the failing test output in plain language, name the likely cause, and give a hint or guiding question. Never write the fixed code." },
          { role: "user", content: "My tests failed:\n" + out.slice(-3000) },
        ],
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    console.log("\n🧭 Coach:\n" + (await res.json()).message.content);
  } catch (e) {
    console.log("Couldn't reach Ollama (" + e.message + "). Is it running, and is the model pulled?");
  }
}

runOnce();
if (flag("--watch")) {
  let t;
  fs.watch(dir, { recursive: true }, (_, f) => {
    if (!f || /node_modules|\.git/.test(f)) return;
    clearTimeout(t);
    t = setTimeout(runOnce, 800);
  });
  console.log("Watching for changes. Press Ctrl+C to stop.");
}
