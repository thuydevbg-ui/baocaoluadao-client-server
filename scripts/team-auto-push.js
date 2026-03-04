#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function log(message) {
  const now = new Date().toISOString();
  console.log(`[team-auto-push][${now}] ${message}`);
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function runGit(args, allowFailure = false) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !allowFailure) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    throw new Error(stderr || stdout || `git ${args.join(' ')} failed`);
  }

  return {
    status: result.status || 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function nowUtcString() {
  const iso = new Date().toISOString();
  return iso.replace('T', ' ').replace('.000Z', ' UTC');
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isGitBusy(gitDir) {
  const busyFiles = [
    'MERGE_HEAD',
    'CHERRY_PICK_HEAD',
    'REVERT_HEAD',
    'BISECT_LOG',
    'index.lock',
  ];
  const busyDirs = ['rebase-merge', 'rebase-apply'];

  for (const name of busyFiles) {
    if (fileExists(path.join(gitDir, name))) return true;
  }

  for (const name of busyDirs) {
    if (fileExists(path.join(gitDir, name))) return true;
  }

  return false;
}

function hasUpstream() {
  return runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], true).status === 0;
}

function getCurrentBranch() {
  return runGit(['rev-parse', '--abbrev-ref', 'HEAD']).stdout;
}

function getStatusSnapshot() {
  return runGit(['status', '--porcelain', '--untracked-files=normal']).stdout;
}

function buildCommitMessage(prefix) {
  const user = process.env.USER || process.env.USERNAME || 'unknown';
  const host = os.hostname() || 'unknown-host';
  return `${prefix} [${user}@${host}] (${nowUtcString()})`;
}

function ensureGitIdentity() {
  const name = runGit(['config', 'user.name'], true).stdout;
  const email = runGit(['config', 'user.email'], true).stdout;
  if (!name || !email) {
    throw new Error(
      'Missing git identity. Run: git config user.name "Your Name" && git config user.email "you@example.com"'
    );
  }
}

function ensureLockFile(lockPath) {
  if (fileExists(lockPath)) {
    const existing = fs.readFileSync(lockPath, 'utf8').trim();
    const pid = Number.parseInt(existing, 10);
    if (Number.isFinite(pid) && processExists(pid)) {
      throw new Error(`Another auto-push process is running (pid=${pid}).`);
    }
    fs.rmSync(lockPath, { force: true });
  }

  fs.writeFileSync(lockPath, String(process.pid), { encoding: 'utf8' });
}

function removeLockFile(lockPath) {
  try {
    fs.rmSync(lockPath, { force: true });
  } catch {
    // Ignore cleanup failures.
  }
}

function parseBranchList(value, fallback) {
  return String(value || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isProtectedBranch(branch) {
  const protectedBranches = parseBranchList(
    process.env.AUTO_PUSH_PROTECTED_BRANCHES,
    'main,master,production'
  );
  return protectedBranches.includes(branch);
}

function pushBranch(remote, branch) {
  if (hasUpstream()) {
    return runGit(['push', remote, branch], true);
  }
  return runGit(['push', '--set-upstream', remote, branch], true);
}

function attemptSyncWithRemote(remote, branch) {
  const pull = runGit(['pull', '--rebase', remote, branch], true);
  if (pull.status !== 0) {
    log(`Cannot rebase with ${remote}/${branch}. Resolve manually. ${pull.stderr || pull.stdout}`);
    return false;
  }
  return true;
}

function runOnce(context) {
  const { gitDir, branch, remote, messagePrefix, rebaseOnPushReject } = context;

  const currentBranch = getCurrentBranch();
  if (currentBranch !== branch) {
    throw new Error(
      `Branch changed from "${branch}" to "${currentBranch}". Stop auto-push and restart on the new branch.`
    );
  }

  if (isGitBusy(gitDir)) {
    log('Git operation in progress (merge/rebase/cherry-pick). Skipping this cycle.');
    return;
  }

  const before = getStatusSnapshot();
  if (!before) return;

  runGit(['add', '-A']);
  const diffCheck = runGit(['diff', '--cached', '--quiet'], true);
  if (diffCheck.status === 0) return;

  const commitMessage = buildCommitMessage(messagePrefix);
  const commit = runGit(['commit', '-m', commitMessage], true);
  if (commit.status !== 0) {
    log(`Commit skipped. ${commit.stderr || commit.stdout}`);
    return;
  }

  const push = pushBranch(remote, branch);
  if (push.status === 0) {
    log(`Pushed to ${remote}/${branch}: "${commitMessage}"`);
    return;
  }

  if (!rebaseOnPushReject) {
    log(`Push failed: ${push.stderr || push.stdout}`);
    return;
  }

  log(`Push rejected, attempting rebase with ${remote}/${branch}...`);
  const rebaseOk = attemptSyncWithRemote(remote, branch);
  if (!rebaseOk) return;

  const retry = pushBranch(remote, branch);
  if (retry.status !== 0) {
    log(`Push retry failed: ${retry.stderr || retry.stdout}`);
    return;
  }

  log(`Pushed after rebase to ${remote}/${branch}.`);
}

function main() {
  const intervalSeconds = parsePositiveInteger(process.env.AUTO_PUSH_INTERVAL, 10);
  const intervalMs = intervalSeconds * 1000;
  const messagePrefix = process.env.AUTO_PUSH_MESSAGE_PREFIX || 'chore(auto): sync changes';
  const remote = process.env.AUTO_PUSH_REMOTE || 'origin';
  const onceMode = process.env.AUTO_PUSH_ONCE === '1';
  const allowProtected = process.env.AUTO_PUSH_ALLOW_PROTECTED === '1';
  const rebaseOnPushReject = process.env.AUTO_PUSH_REBASE_ON_REJECT !== '0';

  const gitDir = runGit(['rev-parse', '--git-dir']).stdout;
  const lockPath = path.join(gitDir, 'team-auto-push.lock');

  ensureGitIdentity();

  const branch = process.env.AUTO_PUSH_BRANCH || getCurrentBranch();
  if (branch === 'HEAD') {
    throw new Error('Detached HEAD is not supported. Checkout a branch first.');
  }

  if (isProtectedBranch(branch) && !allowProtected) {
    throw new Error(
      `Protected branch "${branch}" blocked. Set AUTO_PUSH_ALLOW_PROTECTED=1 if you really want this.`
    );
  }

  const remoteExists = runGit(['remote', 'get-url', remote], true);
  if (remoteExists.status !== 0) {
    throw new Error(`Remote "${remote}" not found.`);
  }

  ensureLockFile(lockPath);
  process.on('SIGINT', () => {
    removeLockFile(lockPath);
    log('Stopped.');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    removeLockFile(lockPath);
    log('Stopped.');
    process.exit(0);
  });
  process.on('exit', () => removeLockFile(lockPath));

  const context = {
    gitDir,
    branch,
    remote,
    messagePrefix,
    rebaseOnPushReject,
  };

  log(`Watching branch "${branch}" on remote "${remote}" every ${intervalSeconds}s.`);
  log('Press Ctrl+C to stop.');

  if (onceMode) {
    runOnce(context);
    return;
  }

  setInterval(() => {
    try {
      runOnce(context);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log(`Stopped with error: ${errorMessage}`);
      process.exit(1);
    }
  }, intervalMs);
}

try {
  main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  log(`Startup failed: ${message}`);
  process.exit(1);
}
