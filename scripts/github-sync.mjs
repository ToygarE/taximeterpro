#!/usr/bin/env node
/**
 * GitHub Sync Script
 * Uses GITHUB_TOKEN (injected by the Replit GitHub integration) to push the
 * current branch to origin automatically.
 *
 * If the remote has diverged (non-fast-forward), the script rebases local
 * commits on top of the remote before pushing.
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

function runSilent(cmd) {
  const result = spawnSync("sh", ["-c", cmd], { encoding: "utf8" });
  return { ok: result.status === 0, out: result.stdout?.trim(), err: result.stderr?.trim() };
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

  // Write credential helper once — used for both fetch and push
  const helperPath = join(tmpdir(), `gh-cred-helper-${process.pid}.sh`);
  writeFileSync(
    helperPath,
    `#!/bin/sh\necho "username=x-access-token"\necho "password=${token}"\n`,
    { mode: 0o700 }
  );

  const gitWithCreds = `git -c credential.helper=${helperPath}`;

  try {
    // Fetch remote branch so we can compare SHAs
    const fetchResult = spawnSync("sh", ["-c", `${gitWithCreds} fetch origin ${branch} --quiet`], { encoding: "utf8" });
    if (fetchResult.status !== 0) {
      // First push to a new branch — no remote ref yet, continue to push
      console.log("No remote ref yet — first push.");
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

    // Check if remote has commits that local doesn't (diverged / behind)
    let behindCount = 0;
    if (remoteSha) {
      const countResult = runSilent(`git rev-list --count ${branch}..origin/${branch}`);
      behindCount = parseInt(countResult.out || "0", 10);
    }

    if (behindCount > 0) {
      console.log(`Local is ${behindCount} commit(s) behind remote — rebasing...`);
      const rebaseResult = spawnSync("sh", ["-c", `git rebase origin/${branch}`], { encoding: "utf8", stdio: "pipe" });
      if (rebaseResult.status !== 0) {
        // Rebase failed (conflicts) — abort and force-push local version
        runSilent("git rebase --abort");
        console.warn("Rebase had conflicts — pushing local version (Replit is source of truth).");
        const forcePush = spawnSync(
          "sh",
          ["-c", `${gitWithCreds} push origin ${branch}:${branch} --force-with-lease`],
          { encoding: "utf8", stdio: "pipe" }
        );
        if (forcePush.status !== 0) {
          console.error("Force-push also failed:");
          console.error(forcePush.stderr || forcePush.stdout);
          process.exit(1);
        }
        console.log("Force-push successful.");
        return;
      }
      console.log("Rebase complete.");
    }

    console.log(`Pushing ${localSha.slice(0, 7)} → origin/${branch} ...`);

    const result = spawnSync(
      "sh",
      ["-c", `${gitWithCreds} push origin ${branch}:${branch}`],
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
