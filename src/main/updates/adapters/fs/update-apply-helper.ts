import { app } from 'electron'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'

import type { ApplyPlan } from '../../../../types/apply-plan.types'
import { UPDATE_CACHE_DIR_NAME } from '../../shared/update.types'

const UPDATE_HELPER_EXE_NAME = 'update-helper.exe'

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

export async function prepareUpdateApplyHelper({
  latestVersion,
  appPid,
  installDir,
  extractedAppDir,
  targetExePath
}: PrepareHelperParams): Promise<PrepareHelperResult> {
  const versionDir = getVersionDir(latestVersion)
  const planPath = path.join(versionDir, `apply-plan-${latestVersion}.json`)
  const logPath = path.join(versionDir, `apply-update-${latestVersion}.log`)
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
