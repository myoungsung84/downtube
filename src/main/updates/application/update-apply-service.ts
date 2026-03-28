import { spawn } from 'child_process'
import { app, BrowserWindow } from 'electron'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'

import type { AppResult } from '../../../types/error.types'
import type { ApplyUpdateResult, PreparedUpdateCache } from '../../../types/update.types'
import {
  failureFromUnknown,
  failureResult,
  normalizeUnknownAppError,
  successResult
} from '../../common/app-error'
import { createUpdateApplyScript } from '../adapters/fs/update-apply-script'
import { getCurrentInstallDir, isSamePath, pathsOverlap } from '../adapters/fs/update-install-dir'
import { WINDOWS_PORTABLE_EXECUTABLE_NAME } from '../shared/update.types'
import { getPreparedUpdateCache } from './update-download-service'
import { emitAppUpdateEvent } from './update-events'

const WINDOWS_PLATFORM = 'win32'
const APPLY_QUIT_DELAY_MS = 1000
const APPLY_EXIT_FALLBACK_DELAY_MS = 5000
const SHOW_APPLY_SCRIPT_WINDOW = false

let applyInFlight = false

function emitApplyValidationError(
  code: Parameters<typeof failureResult>[0],
  detail?: string
): void {
  emitAppUpdateEvent({
    type: 'error',
    stage: 'applying',
    error: { code, ...(detail ? { detail } : {}) }
  })
}

function validatePreparedUpdateForApply(): AppResult<PreparedUpdateCache & { installDir: string }> {
  if (process.platform !== WINDOWS_PLATFORM) {
    return failureResult('updates.unsupported_platform')
  }

  if (!app.isPackaged) {
    return failureResult('updates.apply_not_allowed')
  }

  const installDir = getCurrentInstallDir()
  if (!installDir) {
    return failureResult('updates.invalid_install_dir')
  }

  const preparedUpdate = getPreparedUpdateCache()
  if (!preparedUpdate) {
    return failureResult('updates.prepared_update_missing')
  }

  if (!preparedUpdate.extractedAppRoot || !preparedUpdate.exePath || !preparedUpdate.zipPath) {
    return failureResult('updates.prepared_update_missing')
  }

  if (!fs.existsSync(preparedUpdate.zipPath)) {
    return failureResult('updates.prepared_update_missing', preparedUpdate.zipPath)
  }

  if (!fs.existsSync(preparedUpdate.extractedDir)) {
    return failureResult('updates.prepared_update_missing', preparedUpdate.extractedDir)
  }

  if (!fs.existsSync(preparedUpdate.extractedAppRoot) || !fs.existsSync(preparedUpdate.exePath)) {
    return failureResult('updates.prepared_update_missing', preparedUpdate.exePath)
  }

  const targetExePath = path.join(installDir, WINDOWS_PORTABLE_EXECUTABLE_NAME)
  if (isSamePath(preparedUpdate.extractedAppRoot, installDir)) {
    return failureResult('updates.invalid_install_dir')
  }

  if (pathsOverlap(preparedUpdate.extractedAppRoot, installDir)) {
    return failureResult('updates.invalid_install_dir')
  }

  return successResult({
    ...preparedUpdate,
    installDir,
    exePath: preparedUpdate.exePath || targetExePath
  })
}

export function getPreparedUpdate(): PreparedUpdateCache | null {
  return getPreparedUpdateCache()
}

export async function applyUpdate(): Promise<AppResult<ApplyUpdateResult>> {
  if (applyInFlight) {
    return failureResult('common.invalid_request', 'Update apply is already running.')
  }

  log.info('[updates] apply requested')

  const validation = validatePreparedUpdateForApply()
  if (!validation.success) {
    log.warn('[updates] apply validation failure', validation.error)
    emitApplyValidationError(validation.error.code, validation.error.detail)
    return validation
  }

  const preparedUpdate = validation

  log.info('[updates] prepared update validated', {
    latestVersion: preparedUpdate.latestVersion,
    installDir: preparedUpdate.installDir,
    extractedAppRoot: preparedUpdate.extractedAppRoot,
    exePath: preparedUpdate.exePath
  })

  applyInFlight = true

  try {
    emitAppUpdateEvent({
      type: 'apply-started',
      latestVersion: preparedUpdate.latestVersion
    })

    const targetExePath = path.join(preparedUpdate.installDir, WINDOWS_PORTABLE_EXECUTABLE_NAME)
    const scriptInfo = await createUpdateApplyScript({
      latestVersion: preparedUpdate.latestVersion,
      appPid: process.pid,
      installDir: preparedUpdate.installDir,
      extractedAppRoot: preparedUpdate.extractedAppRoot,
      targetExePath
    })

    log.info('[updates] apply script created', scriptInfo)

    const executable = 'cmd.exe'
    const args = ['/d', '/c', scriptInfo.scriptPath]
    const cwd = path.dirname(scriptInfo.scriptPath)

    log.info('[updates] apply launch attempted', {
      latestVersion: preparedUpdate.latestVersion,
      executable,
      args,
      cwd,
      scriptPath: scriptInfo.scriptPath
    })

    const child = spawn(executable, args, {
      cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: !SHOW_APPLY_SCRIPT_WINDOW
    })

    child.on('error', (error) => {
      log.error('[updates] apply script launch error', {
        latestVersion: preparedUpdate.latestVersion,
        scriptPath: scriptInfo.scriptPath,
        cwd,
        error
      })
    })

    log.info('[updates] apply launch succeeded', {
      latestVersion: preparedUpdate.latestVersion,
      scriptPath: scriptInfo.scriptPath,
      cwd,
      pid: child.pid ?? null,
      windowsHide: !SHOW_APPLY_SCRIPT_WINDOW
    })

    child.unref()

    emitAppUpdateEvent({
      type: 'apply-launching',
      latestVersion: preparedUpdate.latestVersion
    })

    log.info('[updates] apply script launch acknowledged', {
      latestVersion: preparedUpdate.latestVersion,
      scriptPath: scriptInfo.scriptPath,
      pid: child.pid ?? null
    })

    let quitObserved = false
    const handleQuitObserved = (): void => {
      quitObserved = true
      log.info('[updates] quit event observed during apply', {
        latestVersion: preparedUpdate.latestVersion,
        pid: child.pid ?? null
      })
    }

    app.once('quit', handleQuitObserved)

    setTimeout(() => {
      log.info('[updates] app.quit() about to be called for update', {
        latestVersion: preparedUpdate.latestVersion,
        pid: child.pid ?? null,
        quitDelayMs: APPLY_QUIT_DELAY_MS,
        windowCount: BrowserWindow.getAllWindows().length
      })

      const fallbackTimer = setTimeout(() => {
        if (quitObserved) {
          return
        }

        log.warn('[updates] app.quit() fallback to app.exit(0)', {
          latestVersion: preparedUpdate.latestVersion,
          pid: child.pid ?? null,
          fallbackDelayMs: APPLY_EXIT_FALLBACK_DELAY_MS,
          windowCount: BrowserWindow.getAllWindows().length
        })
        app.exit(0)
      }, APPLY_EXIT_FALLBACK_DELAY_MS)

      app.once('quit', () => {
        clearTimeout(fallbackTimer)
      })

      log.info('[updates] quitting app for update', {
        latestVersion: preparedUpdate.latestVersion,
        pid: child.pid ?? null,
        quitDelayMs: APPLY_QUIT_DELAY_MS,
        windowCount: BrowserWindow.getAllWindows().length
      })
      app.quit()
      log.info('[updates] app.quit() called for update', {
        latestVersion: preparedUpdate.latestVersion,
        pid: child.pid ?? null,
        windowCount: BrowserWindow.getAllWindows().length
      })
    }, APPLY_QUIT_DELAY_MS)

    return successResult({
      started: true
    })
  } catch (error) {
    applyInFlight = false
    const normalizedError = normalizeUnknownAppError('updates.apply_failed', error)

    emitAppUpdateEvent({
      type: 'error',
      stage: 'applying',
      error: normalizedError,
      latestVersion: preparedUpdate.latestVersion,
      assetName: preparedUpdate.assetName
    })
    log.error('[updates] apply failed', error)
    return failureFromUnknown('updates.apply_failed', error)
  }
}
