export type AppRuntimeInfo = {
  version: string
  platform: NodeJS.Platform
  isPackaged: boolean
  execPath: string
  installDir: string | null
}
