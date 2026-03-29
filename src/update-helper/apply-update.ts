import { execFileSync } from 'child_process'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import type { ApplyPlan } from '../main/updates/shared/apply-plan.types'
import type { HelperLogger } from './helper-log'

const WAIT_TIMEOUT_MS = 20_000
const WAIT_INTERVAL_MS = 1_000
const DRIVE_ROOT_RE = /^[A-Za-z]:\\$/

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForProcessExit(pid: number, log: HelperLogger): Promise<void> {
  let elapsed = 0

  while (elapsed < WAIT_TIMEOUT_MS) {
    if (!isProcessRunning(pid)) {
      log('pid exited')
      return
    }
    log(`pid ${pid} still running elapsed=${elapsed}ms`)
    await sleep(WAIT_INTERVAL_MS)
    elapsed += WAIT_INTERVAL_MS
  }

  log(`wait timeout after ${WAIT_TIMEOUT_MS}ms, attempting taskkill`)
  try {
    execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true
    })
    log('taskkill succeeded')
  } catch {
    log('taskkill failed')
  }

  await sleep(2000)

  if (isProcessRunning(pid)) {
    log('pid still running after taskkill, aborting')
    process.exit(21)
  }

  log('pid exited after taskkill')
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true })
  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}

async function cleanInstallDir(installDir: string, log: HelperLogger): Promise<void> {
  let entries: fs.Dirent[] = []
  try {
    entries = await fs.promises.readdir(installDir, { withFileTypes: true })
  } catch {
    log(`readdir failed for ${installDir}, proceeding`)
    return
  }

  for (const entry of entries) {
    const targetPath = path.join(installDir, entry.name)
    log(`clean [${entry.isDirectory() ? 'dir' : 'file'}] ${entry.name}`)
    try {
      await fs.promises.rm(targetPath, { recursive: true, force: true })
    } catch (err) {
      log(`clean failed ${entry.name}: ${(err as Error).message}`)
    }
  }
}

export async function runApplyUpdate(plan: ApplyPlan, log: HelperLogger): Promise<void> {
  log('apply started')
  log(`version=${plan.version} appPid=${plan.appPid}`)
  log(`installDir=${plan.installDir}`)
  log(`extractedAppDir=${plan.extractedAppDir}`)
  log(`targetExe=${plan.targetExe}`)

  await waitForProcessExit(plan.appPid, log)

  if (!fs.existsSync(plan.extractedAppDir)) {
    log('source directory missing, aborting')
    process.exit(10)
  }

  if (DRIVE_ROOT_RE.test(plan.installDir)) {
    log('install dir is a drive root, aborting')
    process.exit(13)
  }

  log('cleaning install directory')
  await cleanInstallDir(plan.installDir, log)
  log('clean finished')

  log('copying extracted files to install directory')
  await copyDir(plan.extractedAppDir, plan.installDir)
  log('copy finished')

  if (!fs.existsSync(plan.targetExe)) {
    log('target exe missing after copy, aborting')
    process.exit(11)
  }
  log('target exe verified')

  log('launching new exe')
  const child = spawn(plan.targetExe, [], {
    detached: true,
    stdio: 'ignore'
  })
  child.unref()
  log('new exe launched')

  log('apply complete')
  process.exit(0)
}
