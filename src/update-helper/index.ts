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

async function main(): Promise<void> {
  const planPath = parsePlanPath(process.argv.slice(2))

  if (!planPath) {
    process.stderr.write('update-helper: --plan <path> argument is required\n')
    process.exit(1)
  }

  let plan: ApplyPlan

  try {
    const raw = fs.readFileSync(planPath, 'utf-8')
    plan = JSON.parse(raw) as ApplyPlan
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
