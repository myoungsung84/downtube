import fs from 'fs'

export type HelperLogger = (message: string) => void

export function createHelperLogger(logPath: string): HelperLogger {
  return function log(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}\n`
    try {
      fs.appendFileSync(logPath, line, 'utf-8')
    } catch {
      // ignore log write failures
    }
    process.stderr.write(line)
  }
}
