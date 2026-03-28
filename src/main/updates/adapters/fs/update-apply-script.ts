import fs from 'fs'
import path from 'path'

import { getUpdateCachePaths } from './update-paths'

type CreateUpdateApplyScriptParams = {
  latestVersion: string
  appPid: number
  installDir: string
  extractedAppRoot: string
  targetExePath: string
}

type UpdateApplyScriptInfo = {
  scriptPath: string
  logPath: string
}

function escapeBatchValue(value: string): string {
  return value.replace(/%/g, '%%')
}

export async function createUpdateApplyScript({
  latestVersion,
  appPid,
  installDir,
  extractedAppRoot,
  targetExePath
}: CreateUpdateApplyScriptParams): Promise<UpdateApplyScriptInfo> {
  const cachePaths = getUpdateCachePaths(latestVersion, `apply-${latestVersion}`)
  const scriptPath = path.join(cachePaths.versionDir, `apply-update-${latestVersion}.cmd`)
  const logPath = path.join(cachePaths.versionDir, `apply-update-${latestVersion}.log`)

  await fs.promises.mkdir(cachePaths.versionDir, { recursive: true })

  const script = [
    '@echo off',
    'setlocal enableextensions',
    `set "APP_PID=${appPid}"`,
    `set "INSTALL_DIR=${escapeBatchValue(installDir)}"`,
    `set "SOURCE_DIR=${escapeBatchValue(extractedAppRoot)}"`,
    `set "TARGET_EXE=${escapeBatchValue(targetExePath)}"`,
    `set "LOG_PATH=${escapeBatchValue(logPath)}"`,
    'call :log "waiting for app process %APP_PID% to exit"',
    ':wait_for_app_exit',
    'tasklist /FI "PID eq %APP_PID%" | find "%APP_PID%" >nul',
    'if not errorlevel 1 (',
    '  timeout /t 1 /nobreak >nul',
    '  goto wait_for_app_exit',
    ')',
    'if not exist "%SOURCE_DIR%" (',
    '  call :log "source directory missing"',
    '  exit /b 10',
    ')',
    'if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"',
    'call :log "cleaning install directory"',
    'for /f "delims=" %%I in (\'dir /a /b "%INSTALL_DIR%" 2^>nul\') do (',
    '  if exist "%INSTALL_DIR%\\%%I\\" (',
    '    rmdir /s /q "%INSTALL_DIR%\\%%I" >> "%LOG_PATH%" 2>&1',
    '  ) else (',
    '    del /f /q "%INSTALL_DIR%\\%%I" >> "%LOG_PATH%" 2>&1',
    '  )',
    ')',
    'call :log "copying extracted files into install directory"',
    'robocopy "%SOURCE_DIR%" "%INSTALL_DIR%" /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /NFL /NDL /NJH /NJS >> "%LOG_PATH%" 2>&1',
    'set "ROBOCOPY_EXIT=%ERRORLEVEL%"',
    'if %ROBOCOPY_EXIT% GEQ 8 (',
    '  call :log "robocopy failed with exit code %ROBOCOPY_EXIT%"',
    '  exit /b %ROBOCOPY_EXIT%',
    ')',
    'if not exist "%TARGET_EXE%" (',
    '  call :log "target exe missing after copy"',
    '  exit /b 11',
    ')',
    'call :log "launching new exe"',
    'start "" "%TARGET_EXE%"',
    'start "" cmd /c ping 127.0.0.1 -n 3 >nul ^& del /f /q "%~f0" >nul 2^>^&1',
    'exit /b 0',
    ':log',
    '>> "%LOG_PATH%" echo [%DATE% %TIME%] %~1',
    'goto :eof',
    ''
  ].join('\r\n')

  await fs.promises.writeFile(scriptPath, script, 'utf-8')

  return {
    scriptPath,
    logPath
  }
}
