#!/usr/bin/env node
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * LLM Git Commit Message Generator (llama.cpp server)
 *
 * - Generates Conventional Commit style message
 * - Output commit message in Korean (subject + body)
 * - Includes staged + working tree + untracked files (content, expanded)
 * - Loads prompts from files (system/user)
 *
 * Usage:
 *   node scripts/llm-diff-commit.mjs
 *   node scripts/llm-diff-commit.mjs --all
 *   node scripts/llm-diff-commit.mjs --base HEAD~1
 *   node scripts/llm-diff-commit.mjs --staged
 *   node scripts/llm-diff-commit.mjs --show-diff
 *   node scripts/llm-diff-commit.mjs --system scripts/prompts/commit.system.txt --user scripts/prompts/commit.user.txt
 *
 * Notes:
 * - Default: staged first, if empty then working tree; PLUS untracked always appended.
 * - --staged: only staged + untracked
 * - --all: diff HEAD + untracked
 * - --base <rev>: diff <rev> + untracked
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/* =========================
 * Config
 * ========================= */
const BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:18080'
const MODEL = process.env.LLM_MODEL || ''
const MAX_CHARS = Number(process.env.LLM_DIFF_MAX_CHARS || 12000)
const MAX_UNTRACKED_FILES = Number(process.env.LLM_MAX_UNTRACKED_FILES || 50)
const MAX_UNTRACKED_FILE_BYTES = Number(process.env.LLM_MAX_UNTRACKED_FILE_BYTES || 60_000)

/* =========================
 * Utils
 * ========================= */
const args = new Set(process.argv.slice(2))
const SHOW_DIFF = args.has('--show-diff')

const opt = (name) => {
  const idx = process.argv.indexOf(name)
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]
  return null
}

function sh(cmd) {
  return execSync(cmd, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  }).trim()
}

function shOrEmpty(cmd) {
  try {
    return sh(cmd)
  } catch {
    return ''
  }
}

function truncate(text, max) {
  if (text.length <= max) return text
  return text.slice(0, max) + `\n\n... (truncated ${text.length - max} chars)`
}

function printDiffForDebug(bundleText) {
  const clipped = truncate(bundleText, MAX_CHARS)
  console.log('\n===== DIFF (SENT TO LLM) =====\n')
  console.log(clipped)
  console.log('\n==============================\n')
}

function sanitizeCommitMessage(text) {
  let out = (text || '').trim()

  // Remove fenced code blocks
  if (out.startsWith('```')) {
    out = out
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/```$/, '')
      .trim()
  }

  // Remove wrapping quotes
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim()
  }

  // Normalize line endings
  out = out.replaceAll('\r\n', '\n')

  return out
}

/* =========================
 * Prompt files
 * ========================= */
function getRepoRoot() {
  return shOrEmpty('git rev-parse --show-toplevel') || process.cwd()
}

const REPO_ROOT = getRepoRoot()
const PROMPTS_DIR = path.join(REPO_ROOT, 'scripts', 'prompts')
const DEFAULT_SYSTEM_PATH = path.join(PROMPTS_DIR, 'commit.system.txt')
const DEFAULT_USER_PATH = path.join(PROMPTS_DIR, 'commit.user.txt')

function toAbs(p) {
  if (!p) return p
  if (path.isAbsolute(p)) return p
  return path.join(REPO_ROOT, p)
}

function readPromptFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim()
  } catch {
    return null
  }
}

function applyTemplate(tpl, vars) {
  let out = tpl
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

/* =========================
 * Git helpers (untracked expand)
 * ========================= */
function listFilesRecursive(absDir) {
  const out = []
  const entries = fs.readdirSync(absDir, { withFileTypes: true })
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name)
    if (ent.isDirectory()) out.push(...listFilesRecursive(abs))
    else if (ent.isFile()) out.push(abs)
  }
  return out
}

function expandUntrackedPaths(relPaths) {
  const out = []
  for (const rel of relPaths) {
    const abs = path.join(REPO_ROOT, rel)
    try {
      const st = fs.statSync(abs)
      if (st.isDirectory()) {
        for (const fAbs of listFilesRecursive(abs)) {
          out.push(path.relative(REPO_ROOT, fAbs))
        }
      } else if (st.isFile()) {
        out.push(rel)
      }
    } catch {
      // ignore
    }
  }
  return [...new Set(out)]
}

function getUntrackedFiles() {
  const out = shOrEmpty('git status --porcelain')
  if (!out) return []

  const raw = out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('?? '))
    .map((l) => l.slice(3))
    .filter(Boolean)

  const expanded = expandUntrackedPaths(raw)

  // NEVER include llm models (huge) or gguf
  const filtered = expanded.filter((p) => {
    const norm = p.replaceAll('\\', '/')
    if (norm.startsWith('llm/models/')) return false
    if (norm.endsWith('.gguf')) return false
    return true
  })

  return filtered
}

function isProbablyTextFile(relPath) {
  const lower = relPath.toLowerCase()
  const binaryExts = [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.gif',
    '.ico',
    '.pdf',
    '.zip',
    '.7z',
    '.tar',
    '.gz',
    '.tgz',
    '.rar',
    '.exe',
    '.dll',
    '.dmg',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.mp4',
    '.mov',
    '.mp3',
    '.wav',
    '.gguf'
  ]
  return !binaryExts.some((ext) => lower.endsWith(ext))
}

function readTextFileSafe(relPath) {
  try {
    const abs = path.join(REPO_ROOT, relPath)
    const st = fs.statSync(abs)
    if (!st.isFile()) return null
    if (st.size > MAX_UNTRACKED_FILE_BYTES) return `<<file too large: ${st.size} bytes>>`
    return fs.readFileSync(abs, 'utf8')
  } catch {
    return null
  }
}

function formatUntrackedSection(files) {
  if (!files.length) return ''

  const limited = files.slice(0, MAX_UNTRACKED_FILES)
  const lines = []

  lines.push('### UNTRACKED FILES (new files, content included)')
  lines.push(
    `# count: ${files.length} (showing: ${limited.length}, per-file max: ${MAX_UNTRACKED_FILE_BYTES} bytes)`
  )
  lines.push('')

  for (const file of limited) {
    if (!isProbablyTextFile(file)) {
      lines.push(`--- a/${file}`)
      lines.push(`+++ b/${file}`)
      lines.push('@@')
      lines.push('<<skipped (binary or excluded extension)>>')
      lines.push('')
      continue
    }

    const content = readTextFileSafe(file)
    lines.push(`--- a/${file}`)
    lines.push(`+++ b/${file}`)
    lines.push('@@')
    lines.push(content == null || content === '' ? '<<empty or unreadable>>' : content)
    lines.push('')
  }

  if (files.length > limited.length) {
    lines.push(`<<skipped remaining untracked files: ${files.length - limited.length}>>`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Build a single bundle text that LLM will read:
 * - header: stat + status (helps model see scope)
 * - main diff: staged/working/base/all depending on flags
 * - untracked files: appended (expanded file list + content)
 */
function getDiffBundle() {
  const base = opt('--base')

  const statStaged = shOrEmpty('git diff --staged --stat')
  const statWork = shOrEmpty('git diff --stat')
  const status = shOrEmpty('git status --porcelain')

  const header = [
    '### CHANGE OVERVIEW',
    '',
    '## git diff --staged --stat',
    statStaged || '(empty)',
    '',
    '## git diff --stat',
    statWork || '(empty)',
    '',
    '## git status --porcelain',
    status || '(empty)',
    ''
  ].join('\n')

  let mainDiff = ''
  if (base) mainDiff = shOrEmpty(`git diff ${base}`)
  else if (args.has('--all')) mainDiff = shOrEmpty('git diff HEAD')
  else if (args.has('--staged')) mainDiff = shOrEmpty('git diff --staged')
  else {
    const staged = shOrEmpty('git diff --staged')
    mainDiff = staged || shOrEmpty('git diff')
  }

  const diffSection = ['### DIFF', '', mainDiff || '(empty)', ''].join('\n')

  const untracked = getUntrackedFiles()
  const untrackedSection = formatUntrackedSection(untracked)

  return [header, diffSection, untrackedSection].filter(Boolean).join('\n')
}

/* =========================
 * LLM
 * ========================= */
async function checkHealth() {
  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error('LLM server not healthy')
}

async function callLLM({ system, user }) {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL || undefined,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`LLM request failed (${res.status})\n${t}`)
  }

  const json = await res.json()
  return json?.choices?.[0]?.message?.content?.trim()
}

/* =========================
 * Main
 * ========================= */
async function main() {
  try {
    await checkHealth()
  } catch {
    console.error('ERROR: LLM server is not reachable.')
    console.error('TIP: Start it first: npm run llm:up')
    process.exit(1)
  }

  const bundle = getDiffBundle()
  if (!bundle || bundle.trim() === '') {
    console.log('INFO: No changes found.')
    return
  }

  if (SHOW_DIFF) printDiffForDebug(bundle)

  const systemPath = toAbs(opt('--system') || DEFAULT_SYSTEM_PATH)
  const userPath = toAbs(opt('--user') || DEFAULT_USER_PATH)

  const systemTpl = readPromptFile(systemPath)
  const userTpl = readPromptFile(userPath)

  if (!systemTpl) {
    console.error(`ERROR: Cannot read system prompt: ${systemPath}`)
    process.exit(1)
  }
  if (!userTpl) {
    console.error(`ERROR: Cannot read user prompt: ${userPath}`)
    process.exit(1)
  }

  const input = truncate(bundle, MAX_CHARS)
  const system = systemTpl
  const user = applyTemplate(userTpl, { INPUT: input })

  const raw = await callLLM({ system, user })
  const message = sanitizeCommitMessage(raw)

  if (!message) {
    console.error('ERROR: Empty response from LLM.')
    process.exit(1)
  }

  console.log('\n===== COMMIT MESSAGE =====\n')
  console.log(message) // <-- Korean result (from prompt)
  console.log('\n==========================\n')
}

main().catch((e) => {
  console.error(String(e?.stack || e))
  process.exit(1)
})
