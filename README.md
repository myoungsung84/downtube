[한국어](./README.ko.md)

# Downtube

<p align="center">
  <img src="./assets/screenshot-main.png" alt="Downtube main screen" width="680" />
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="Platform" />
  <img src="https://img.shields.io/badge/electron-35-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React" />
</p>

An Electron-based desktop app for media downloading and local playback.  
It supports download queue management, video/audio selection, playlist batch add, a built-in player, and theme settings in one app.

> This project is intended for use with publicly licensed media, content you own, or content you are authorized to use.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Build](#build)
- [Project Structure](#project-structure)
- [Main IPC Channels](#main-ipc-channels)
- [Security Notes](#security-notes)
- [Development Notes](#development-notes)
- [License](#license)
- [Usage and Distribution Notice](#usage-and-distribution-notice)

---

## Key Features

- 🎬 Best-quality video download
- 🎵 Audio-only download
- 📋 Playlist item batch add
- ⏱️ Queue-based start, pause, stop, and retry
- 📊 Download progress and status display
- 🎞️ Built-in player playback
- 🌗 Light, dark, and system theme support
- 🔄 yt-dlp update check and management

---

## Tech Stack

| Category         | Technology                         |
| ---------------- | ---------------------------------- |
| Frontend         | React 19, TypeScript, React Router |
| Desktop          | Electron 35, electron-vite         |
| Media Processing | yt-dlp, FFmpeg, ffprobe            |
| UI               | MUI, Emotion                       |
| State            | Zustand                            |
| Build            | electron-builder                   |

---

## Requirements

- **Node.js** 18 or later
- **pnpm**
- **OS**: One of Windows 64-bit, macOS, or Linux
- **yt-dlp**: Depending on the runtime environment, the bundled binary or a user-specified path can be used
- **FFmpeg / ffprobe**: Depending on the runtime environment, the bundled binary or a user-specified path can be used

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd downtube
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Run in development mode

```bash
pnpm dev
```

In development mode, Electron DevTools opens automatically so you can inspect the UI and IPC flow.

### 4. Type check

```bash
# all
pnpm typecheck

# main process only
pnpm typecheck:node

# renderer process only
pnpm typecheck:web
```

### 5. Lint and format

```bash
pnpm lint
pnpm format
```

---

## Build

### Bundle build

```bash
pnpm build
```

### Platform packaging

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac
```

Running scripts directly under `scripts/build-tools/` is also supported.

> **Note**: The Linux packaging script (`build:linux`) is not currently defined in `package.json`.  
> If you need a Linux build, modify the scripts under `scripts/build-tools/` directly or open an issue.

---

## Project Structure

```text
src/
├── main/                          # Electron main process
│   ├── common/                    # App initialization, protocol registration
│   ├── downloads/                 # Download domain logic
│   │   ├── adapters/              # yt-dlp, ffmpeg, fs integration
│   │   ├── application/           # Queue execution, stop, orchestration
│   │   ├── shared/                # Shared download utilities
│   │   ├── index.ts
│   │   └── types.ts
│   ├── ipc-handlers/              # IPC handler registration
│   ├── settings/                  # Settings storage and validation
│   └── index.ts
├── preload/                       # Safe bridge API exposure
├── renderer/
│   ├── app/
│   │   ├── features/
│   │   │   ├── downloads/         # Downloads screen and components
│   │   │   ├── player/            # Player screen and controls
│   │   │   ├── settings/          # Settings screen and state
│   │   │   └── splash/            # Initial loading screen
│   │   ├── pages/                 # Route-level pages
│   │   ├── shared/                # Shared UI, provider, hook
│   │   ├── styles/                # Global styles
│   │   ├── theme/                 # App theme
│   │   ├── router.tsx
│   │   └── app.tsx
│   ├── assets/
│   └── index.html
├── types/                         # Shared types
└── libs/                          # Shared utilities
```

---

## Main IPC Channels

| Channel             | Direction       | Description                            |
| ------------------- | --------------- | -------------------------------------- |
| `download-video`    | renderer → main | Add a video download job               |
| `download-audio`    | renderer → main | Add an audio download job              |
| `download-playlist` | renderer → main | Add playlist items to the queue        |
| `download-set-type` | renderer → main | Change download type of a queued job   |
| `download-stop`     | renderer → main | Stop a running or queued job           |
| `download-remove`   | renderer → main | Remove a job from the queue            |
| `downloads-list`    | renderer → main | Fetch the current download list        |
| `downloads-start`   | renderer → main | Start or resume the download queue     |
| `downloads-pause`   | renderer → main | Pause the download queue               |
| `downloads:event`   | main → renderer | Subscribe to the download event stream |
| `download-player`   | renderer → main | Open the player window                 |
| `download-dir-open` | renderer → main | Open the download folder               |

---

## Security Notes

- **Sandbox enabled**: The renderer process cannot access Node.js APIs directly
- **Context Isolation**: Separates the main world and isolated world to prevent issues such as prototype pollution
- **Restricted IPC**: Only approved channels exposed through the preload bridge (`window.api`) are used
- **External link isolation**: External links in the app open in the system default browser
- **No secrets included**: The app bundle does not contain API keys or sensitive values

---

## Development Notes

### Directory roles

| Path                    | Role                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `src/main`              | Electron main process entry and app init                      |
| `src/main/downloads`    | Download queue, execution flow, yt-dlp and ffmpeg integration |
| `src/main/ipc-handlers` | IPC registration layer connected to preload API               |
| `src/preload`           | Provides a safe renderer bridge as `window.api`               |
| `src/renderer/app`      | UI routing, screens, shared UI, and state management          |

---

## License

The source code of this project is distributed under the [MIT License](./LICENSE).

External tools included in or used with the app are subject to their own licenses.

### Included or used external tools

| Tool    | License                                                                   | Link                                       |
| ------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| yt-dlp  | Unlicense                                                                 | [GitHub](https://github.com/yt-dlp/yt-dlp) |
| FFmpeg  | LGPL-2.1-or-later (GPL family may apply depending on build configuration) | [ffmpeg.org](https://ffmpeg.org)           |
| ffprobe | FFmpeg project component, subject to FFmpeg distribution terms            | [ffmpeg.org](https://ffmpeg.org)           |

---

## Usage and Distribution Notice

Downtube provides media download and local playback features, but users must directly verify the following.

- Whether they own the copyright to the content or have permission to use it
- The terms of service of the platform being used
- The copyright laws and related regulations of the relevant country or region

In particular, when downloading content from platforms such as YouTube, **copyright issues** and **platform terms violations** must be reviewed separately.

The example images and descriptions in this README are intended only to introduce the app UI and do not imply that downloading or redistributing content from any specific platform is freely allowed.

The user bears full responsibility for copyright infringement, service terms violations, redistribution disputes, and commercial use issues arising from use of this project. The project author does not assume legal responsibility for individual use.

---

## Contributing

Issues and pull requests are always welcome.  
Bug reports, feature suggestions, and code contributions are all appreciated.
