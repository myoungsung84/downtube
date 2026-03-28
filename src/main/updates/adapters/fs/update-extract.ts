import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import { WINDOWS_PORTABLE_EXECUTABLE_NAME } from '../../shared/update.types'

const execFileAsync = promisify(execFile)

type ExtractUpdateZipParams = {
  zipPath: string
  extractedDir: string
}

type ExtractUpdateZipResult = {
  extractedDir: string
  extractedAppRoot: string
  exePath: string
}

function toPowerShellLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

async function resolveExtractedAppRoot(extractedDir: string): Promise<string> {
  const directExePath = path.join(extractedDir, WINDOWS_PORTABLE_EXECUTABLE_NAME)
  if (fs.existsSync(directExePath)) {
    return extractedDir
  }

  const entries = await fs.promises.readdir(extractedDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const candidateRoot = path.join(extractedDir, entry.name)
    const candidateExePath = path.join(candidateRoot, WINDOWS_PORTABLE_EXECUTABLE_NAME)

    if (fs.existsSync(candidateExePath)) {
      return candidateRoot
    }
  }

  throw new Error(`Expected executable not found: ${WINDOWS_PORTABLE_EXECUTABLE_NAME}`)
}

export async function extractUpdateZip({
  zipPath,
  extractedDir
}: ExtractUpdateZipParams): Promise<ExtractUpdateZipResult> {
  await fs.promises.rm(extractedDir, { recursive: true, force: true })
  await fs.promises.mkdir(extractedDir, { recursive: true })

  try {
    await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Path '${toPowerShellLiteral(zipPath)}' -DestinationPath '${toPowerShellLiteral(extractedDir)}' -Force`
    ])
  } catch (error) {
    await fs.promises.rm(extractedDir, { recursive: true, force: true })
    throw error
  }

  try {
    const extractedAppRoot = await resolveExtractedAppRoot(extractedDir)
    const exePath = path.join(extractedAppRoot, WINDOWS_PORTABLE_EXECUTABLE_NAME)

    if (!fs.existsSync(exePath)) {
      throw new Error(`Expected executable not found: ${exePath}`)
    }

    return {
      extractedDir,
      extractedAppRoot,
      exePath
    }
  } catch (error) {
    await fs.promises.rm(extractedDir, { recursive: true, force: true })
    throw error
  }
}
