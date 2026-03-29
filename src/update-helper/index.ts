import fs from 'fs'
import path from 'path'

import type { ApplyPlan } from '../main/updates/shared/apply-plan.types'
import { runApplyUpdate } from './apply-update'
import { createHelperLogger } from './helper-log'

function parsePlanPath(argv: string[]): string | null {
  const idx = argv.indexOf('--plan')
  if (idx === -1 || idx + 1 >= argv.length) {
    return null
  }
  return argv[idx + 1]
}

function validatePlan(parsed: unknown): parsed is ApplyPlan {
  if (!parsed || typeof parsed !== 'object') return false
  const p = parsed as Record<string, unknown>
  const versionPattern = /^[a-zA-Z0-9.-]+$/
  return (
    typeof p.version === 'string' &&
    p.version.length > 0 &&
    versionPattern.test(p.version) &&
    typeof p.logPath === 'string' &&
    p.logPath.length > 0 &&
    path.isAbsolute(p.logPath) &&
    Number.isInteger(p.appPid) &&
    (p.appPid as number) > 0 &&
    typeof p.installDir === 'string' &&
    p.installDir.length > 0 &&
    path.isAbsolute(p.installDir) &&
    typeof p.extractedAppDir === 'string' &&
    p.extractedAppDir.length > 0 &&
    path.isAbsolute(p.extractedAppDir) &&
    typeof p.targetExe === 'string' &&
    p.targetExe.length > 0 &&
    path.isAbsolute(p.targetExe)
  )
}

async function main(): Promise<void> {
  const planPath = parsePlanPath(process.argv.slice(2))

  if (!planPath) {
    process.stderr.write('update-helper: --plan <path> argument is required\n')
    process.exit(1)
  }

  let plan: ApplyPlan

  try {
    const raw = fs.readFileSync(planPath, 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (!validatePlan(parsed)) {
      process.stderr.write('update-helper: invalid plan: missing or invalid required fields\n')
      process.exit(3)
    }
    plan = parsed
  } catch (err) {
    process.stderr.write(`update-helper: failed to read plan ${planPath}: ${err}\n`)
    process.exit(2)
  }

  const logDir = path.dirname(plan.logPath)
  try {
    fs.mkdirSync(logDir, { recursive: true })
  } catch {
    // best effort
  }

  const log = createHelperLogger(plan.logPath)

  try {
    await runApplyUpdate(plan, log)
  } catch (err) {
    log(`unhandled error: ${err}`)
    process.exit(99)
  }
}

main()
