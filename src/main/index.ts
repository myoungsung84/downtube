import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import log from 'electron-log'
import { join } from 'path'

import { registerMediaProtocol } from './common/register-media-protocol'
import { ipcHandler } from './ipc-handlers/ipc'

function logAppLifecycle(eventName: string): void {
  log.info(`[app] ${eventName}`, {
    windowCount: BrowserWindow.getAllWindows().length
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    },
    icon: app.isPackaged
      ? join(process.resourcesPath, 'assets', 'app-icon-256.png')
      : join(__dirname, '../assets/app-icon-256.png')
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', () => {
    log.info('[app] main window close event', {
      windowCount: BrowserWindow.getAllWindows().length
    })
    app.quit()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Register IPC handlers before renderer boot to avoid invoke race on first paint.
  ipcHandler(mainWindow)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/splash`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/splash' })
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  registerMediaProtocol()
  logAppLifecycle('ready')

  app.on('browser-window-created', (_, window) => {
    log.info('[app] browser-window-created', {
      windowCount: BrowserWindow.getAllWindows().length
    })
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    logAppLifecycle('activate')
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  logAppLifecycle('window-all-closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logAppLifecycle('before-quit')
})

app.on('will-quit', () => {
  logAppLifecycle('will-quit')
})

app.on('quit', (_, exitCode) => {
  log.info('[app] quit', {
    exitCode,
    windowCount: BrowserWindow.getAllWindows().length
  })
})
