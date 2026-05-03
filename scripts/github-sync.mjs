#!/usr/bin/env node
/**
 * GitHub Sync Script
 * Uses GITHUB_TOKEN (injected by the Replit GitHub integration) to push the
 * current branch to origin automatically.
 *
 * Run via the "GitHub Sync" workflow (every 5 min) or manually:
 *   node scripts/github-sync.mjs
 */

import { execSync, spawnSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", ...opts }).trim();
}

async function main() {
  console.log("=== GitHub Sync ===");
  console.log(new Date().toISOString());

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error(
      "GITHUB_TOKEN is not set. Connect the GitHub integration in Replit."
    );
    process.exit(1);
  }

  const branch = run("git rev-parse --abbrev-ref HEAD");
  console.log(`Branch: ${branch}`);

  const localSha = run("git rev-parse HEAD");

  try {
    run(`git fetch origin ${branch} --quiet`);
  } catch {
    // First push to a new branch — no remote ref yet
  }

  let remoteSha = "";
  try {
    remoteSha = run(`git rev-parse origin/${branch}`);
  } catch {
    remoteSha = "";
  }

  if (localSha === remoteSha) {
    console.log("Already in sync with origin. Nothing to push.");
    return;
  }

  console.log(`Pushing ${localSha.slice(0, 7)} → origin/${branch} ...`);

  // Write a temporary git credential helper script so the token never
  // appears in process arguments or logs.
  const helperPath = join(tmpdir(), `gh-cred-helper-${process.pid}.sh`);
  writeFileSync(
    helperPath,
    `#!/bin/sh\necho "username=x-access-token"\necho "password=${token}"\n`,
    { mode: 0o700 }
  );

  try {
    const result = spawnSync(
      "git",
      [
        "-c", `credential.helper=${helperPath}`,
        "push", "origin", `${branch}:${branch}`,
      ],
      { encoding: "utf8", stdio: "pipe" }
    );

    if (result.status !== 0) {
      console.error("Push failed:");
      console.error(result.stderr || result.stdout);
      process.exit(1);
    }

    console.log((result.stderr || result.stdout || "").trim() || "Push successful.");
  } finally {
    try { unlinkSync(helperPath); } catch { /* ignore */ }
  }

  console.log("=== Sync complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
