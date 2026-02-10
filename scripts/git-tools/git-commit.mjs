#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

/** @typedef {{ status: number | null, stdout: string, stderr: string }} CmdResult */

const __filename = fileURLToPath(import.meta.url)
const SCRIPT_DIR = path.dirname(__filename)
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')
const GEN_SCRIPT = path.join(REPO_ROOT, 'scripts/git-tools/git-generate-commit.sh')

/**
 * @param {string} msg
 * @param {number} [code]
 * @returns {never}
 */
function die(msg, code = 1) {
  console.error(msg)
  process.exit(code)
}

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string }} [opts]
 * @returns {CmdResult}
 */
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? REPO_ROOT,
    encoding: 'utf8'
  })

  return {
    status: r.status,
    stdout: typeof r.stdout === 'string' ? r.stdout : String(r.stdout ?? ''),
    stderr: typeof r.stderr === 'string' ? r.stderr : String(r.stderr ?? '')
  }
}

/**
 * @returns {boolean}
 */
function isGitRepo() {
  const r = run('git', ['rev-parse', '--is-inside-work-tree'])
  return r.status === 0 && r.stdout.trim() === 'true'
}

/**
 * @returns {boolean}
 */
function hasStagedChanges() {
  const r = run('git', ['diff', '--staged', '--quiet'])
  return r.status !== 0
}

/**
 * @returns {string[]}
 */
function getStagedFiles() {
  const r = run('git', ['diff', '--cached', '--name-only', '-z'])
  if (r.status !== 0) die(`ERROR: failed to list staged files\n${r.stderr || r.stdout}`)
  return (r.stdout || '').split('\0').filter(Boolean)
}

/**
 * @param {string} p
 * @returns {boolean}
 */
function isForbiddenPath(p) {
  const forbidden = [
    /^\.env$/,
    /^\.env\./,
    /\.pem$/i,
    /\.key$/i,
    /\.p12$/i,
    /\.pfx$/i,
    /\.jks$/i,
    /\.keystore$/i,
    /^secrets\./i,
    /^secret\./i,
    /^credentials\./i,
    /^creds\./i,
    /^node_modules\//,
    /^dist\//,
    /^out\//,
    /^build\//,
    /^releases\//,
    /^dist-electron\//,
    /\.log$/i,
    /\.log\./i,
    /\.pid$/i,
    /\.lcov$/i
  ]
  return forbidden.some((re) => re.test(p))
}

/**
 * @param {string} question
 * @returns {Promise<string>}
 */
async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ans = await new Promise((resolve) => {
    rl.question(question, (value) => resolve(value))
  })
  rl.close()
  return String(ans ?? '').trim()
}

/**
 * @returns {Promise<string>}
 */
async function selectCommitType() {
  console.log('')

  console.log('Select commit type:')

  console.log('  1) fix      - 버그/오작동/에러 수정')

  console.log('  2) feat     - 사용자 기능 추가')

  console.log('  3) refactor - 기능 동일, 구조 개선')

  console.log('  4) chore    - 빌드/스크립트/도구/의존성/설정/인프라')

  console.log('  5) docs     - 문서')

  console.log('  6) test     - 테스트')

  console.log('  7) perf     - 성능')

  console.log('')

  const a = await prompt('Type [1-7] (default: 4=chore): ')
  const n = a ? Number(a) : 4

  /** @type {Record<number, string>} */
  const map = {
    1: 'fix',
    2: 'feat',
    3: 'refactor',
    4: 'chore',
    5: 'docs',
    6: 'test',
    7: 'perf'
  }

  const t = map[n]
  if (!t) die(`ERROR: invalid choice: ${a || '?'}`)

  console.log(`✅ Selected type: ${t}\n`)
  return t
}

/**
 * @returns {Promise<void>}
 */
async function handleForbiddenFiles() {
  const staged = getStagedFiles()
  const forbidden = staged.filter(isForbiddenPath)

  if (forbidden.length === 0) return

  console.log('🚫 Forbidden staged files detected (should NOT be committed):')
  for (const f of forbidden) {
    console.log(`  - ${f}`)
  }

  console.log('')

  console.log('Choose action:')

  console.log('  1) abort (default)')

  console.log('  2) unstage forbidden files and continue')

  console.log('')

  const a = await prompt('Action [1/2]: ')
  const act = a ? Number(a) : 1

  if (act === 1) die('Canceled.', 1)
  if (act !== 2) die(`ERROR: invalid action: ${a}`)

  for (const f of forbidden) {
    let r = run('git', ['restore', '--staged', '--', f])
    if (r.status !== 0) {
      r = run('git', ['reset', '-q', 'HEAD', '--', f])
      if (r.status !== 0) die(`ERROR: failed to unstage: ${f}\n${r.stderr || r.stdout}`)
    }
  }

  console.log('✅ Unstaged forbidden files.\n')

  if (!hasStagedChanges()) {
    die('ERROR: After filtering, no staged changes remain.\nTIP: stage valid files and retry.')
  }
}

/**
 * @param {string} genOut
 * @returns {string}
 */
function extractCommitMessage(genOut) {
  const lines = String(genOut ?? '').split(/\r?\n/)
  const start = lines.findIndex((l) => l.trim() === '===== COMMIT MESSAGE =====')
  if (start < 0) return ''

  let end = -1
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '==========================') {
      end = i
      break
    }
  }
  if (end < 0) return ''

  return lines
    .slice(start + 1, end)
    .join('\n')
    .trim()
}

/**
 * @param {string} commitType
 * @param {string} msg
 * @returns {string}
 */
function applyType(commitType, msg) {
  const lines = msg.split(/\r?\n/)
  const firstNonEmptyIdx = lines.findIndex((l) => l.trim().length > 0)

  const subject0 = firstNonEmptyIdx >= 0 ? (lines[firstNonEmptyIdx]?.trim() ?? '') : ''
  const body = firstNonEmptyIdx >= 0 ? lines.slice(firstNonEmptyIdx + 1).join('\n') : ''

  const re = /^(feat|fix|refactor|chore|docs|test|perf)(\([^)]+\))?:\s+.+/
  let subject = subject0

  if (re.test(subject0)) {
    subject = subject0.replace(/^(feat|fix|refactor|chore|docs|test|perf)/, commitType)
  } else {
    subject = `${commitType}: ${subject0 || 'update'}`
  }

  const out = [subject]
  if (body.trim().length > 0) out.push('', body.trimEnd())
  return out.join('\n')
}

/**
 * @returns {CmdResult}
 */
function runGenerator() {
  const isWin = process.platform === 'win32'
  if (isWin) return run('bash', [GEN_SCRIPT])
  return run(GEN_SCRIPT, [])
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  if (!fs.existsSync(GEN_SCRIPT)) die(`ERROR: generator not found: ${GEN_SCRIPT}`)
  if (!isGitRepo()) die('ERROR: Not inside a git repository.')
  if (!hasStagedChanges()) die('ERROR: No staged changes.\nTIP: git add -A')

  const commitType = await selectCommitType()
  await handleForbiddenFiles()

  console.log('▶ Running generator:')

  console.log(`  ${GEN_SCRIPT}\n`)

  const r = runGenerator()
  if (r.status !== 0) {
    die(
      `ERROR: Failed to run generator (exit=${r.status ?? 'null'})\n\n----- generator output -----\n${r.stdout || r.stderr
      }\n---------------------------`
    )
  }

  const block = extractCommitMessage(r.stdout || '')
  if (!block.trim()) {
    die(
      `ERROR: Could not extract commit message from generator output.\n\n----- generator output -----\n${r.stdout || ''
      }\n---------------------------`
    )
  }

  const finalMsg = applyType(commitType, block)

  console.log('\n===== COMMIT MESSAGE (PREVIEW) =====\n')

  console.log(finalMsg)

  console.log('\n====================================\n')

  console.log('✅ Step 1~3 done. (No commit/push in this step)')
}

main().catch(
  /** @param {unknown} e @returns {never} */(e) => {
    const msg =
      e && typeof e === 'object' && 'stack' in e
        ? String(/** @type {{stack?: unknown}} */(e).stack)
        : String(e)
    die(`ERROR: ${msg}`, 1)
  }
)
