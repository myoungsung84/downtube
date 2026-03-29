import { app } from 'electron'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'

import type { ApplyPlan } from '../../shared/apply-plan.types'
import {
  UPDATE_APPLY_LOG_PREFIX,
  UPDATE_APPLY_PLAN_PREFIX,
  UPDATE_CACHE_DIR_NAME,
  UPDATE_HELPER_EXE_NAME
} from '../../shared/update.types'

type PrepareHelperResult = {
  helperExePath: string
  planPath: string
  logPath: string
}

type PrepareHelperParams = {
  latestVersion: string
  appPid: number
  installDir: string
  extractedAppDir: string
  targetExePath: string
}

function getSourceHelperExePath(): string {
  return path.join(process.resourcesPath, 'update-helper', UPDATE_HELPER_EXE_NAME)
}

function getVersionDir(latestVersion: string): string {
  return path.join(app.getPath('userData'), UPDATE_CACHE_DIR_NAME, latestVersion)
}

function sanitizeVersionSegment(version: string): string {
  // Replace forbidden chars with '_', collapse consecutive dots, trim, limit length
  const sanitized = version
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 64)
  return sanitized.length > 0 ? sanitized : 'unknown'
}

export async function prepareUpdateApplyHelper({
  latestVersion,
  appPid,
  installDir,
  extractedAppDir,
  targetExePath
}: PrepareHelperParams): Promise<PrepareHelperResult> {
  const safeVersion = sanitizeVersionSegment(latestVersion)
  const versionDir = getVersionDir(safeVersion)
  const planPath = path.join(versionDir, `${UPDATE_APPLY_PLAN_PREFIX}${safeVersion}.json`)
  const logPath = path.join(versionDir, `${UPDATE_APPLY_LOG_PREFIX}${safeVersion}.log`)
  const helperDestPath = path.join(versionDir, UPDATE_HELPER_EXE_NAME)

  await fs.promises.mkdir(versionDir, { recursive: true })

  const sourceHelperPath = getSourceHelperExePath()
  const sourceHelperExists = fs.existsSync(sourceHelperPath)
  log.info('[updates] helper source resolve', {
    resourcesPath: process.resourcesPath,
    sourceHelperPath,
    exists: sourceHelperExists
  })

  if (!sourceHelperExists) {
    throw new Error(`update-helper exe not found at: ${sourceHelperPath}`)
  }

  await fs.promises.copyFile(sourceHelperPath, helperDestPath)
  await fs.promises.chmod(helperDestPath, 0o755).catch(() => undefined)

  const plan: ApplyPlan = {
    version: latestVersion,
    appPid,
    installDir,
    extractedAppDir,
    targetExe: targetExePath,
    logPath
  }

  await fs.promises.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf-8')

  return {
    helperExePath: helperDestPath,
    planPath,
    logPath
  }
}
