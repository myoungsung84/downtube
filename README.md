[한국어](./README.ko.md)

# Downtube

<p align="center">
  <img src="./assets/screenshot-main-en.png" alt="Downtube main screen" width="680" />
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/release-1.0.11-111827" alt="Release 1.0.11" />
  <img src="https://img.shields.io/badge/electron-35-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React" />
</p>

Downtube is a personal Electron desktop app for queue-based media downloads, a completed-items library, local playback, and Windows in-app update delivery.

> Use this project only for media you own, media with a public license, or media you are authorized to use.

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Build and Packaging](#build-and-packaging)
- [Windows Update Flow](#windows-update-flow)
- [Settings and Localization](#settings-and-localization)
- [Project Structure](#project-structure)
- [Main IPC Channels](#main-ipc-channels)
- [Security Notes](#security-notes)
- [Development Notes](#development-notes)
- [License](#license)
- [Usage and Distribution Notice](#usage-and-distribution-notice)
- [Contributing](#contributing)

## Key Features

- Queue-based video and audio downloads
- Playlist parsing and batch enqueue with a configurable playlist limit
- Queue controls for start, pause, stop, remove, retry, and queued-job type switching
- Recent URL history persisted in settings
- Library view for completed downloads with open, reveal, delete, thumbnail, and sidecar metadata reuse
- Built-in player for local video and audio playback
- Player controls for seek, volume, mute, playback rate, fullscreen, audio visualizer, and ambient particles
- Theme mode, theme preset, language, default download type, and playlist limit settings
- Korean and English UI, plus a `system` language preference resolved in the main process
- Runtime startup checks for bundled tools and fallback `yt-dlp` download on Windows and macOS when needed
- Windows update flow for check, download, extract, restart, and apply via a dedicated `update-helper`

## Tech Stack

| Category        | Technology                             |
| --------------- | -------------------------------------- |
| Desktop runtime | Electron, electron-vite                |
| Renderer        | React 19, React Router, TypeScript     |
| UI              | MUI, Emotion                           |
| State           | Zustand                                |
| Localization    | i18next, react-i18next                 |
| Media tools     | yt-dlp, FFmpeg, ffprobe, fluent-ffmpeg |
| Storage         | electron-store                         |
| Build           | electron-builder, esbuild, pkg         |

## Requirements

- Node.js
- pnpm
- Windows or macOS if you plan to use the maintained packaging scripts
- `powershell.exe` if you run `pnpm build:win` from Git Bash, WSL, or another Unix-like shell on Windows
- `gh` CLI only if you use `pnpm release:win`

Notes:

- The renderer currently validates YouTube video and playlist URLs.
- The maintained release/update path is Windows-first.
- `package.json` is the source of truth for electron-builder configuration.

## Getting Started

```bash
git clone <your-repository-url>
cd downtube
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm typecheck
pnpm lint
pnpm format
pnpm clean
pnpm tools:ensure
pnpm build
pnpm build:helper
pnpm build:win
pnpm build:mac
```

## Build and Packaging

### App build

```bash
pnpm build
```

Runs in order:

- `scripts/build-tools/ensure-tools.sh`
- `pnpm typecheck`
- `electron-vite build`

### Helper build

```bash
pnpm build:helper
```

Bundles `src/update-helper/index.ts` with esbuild and packages `out/update-helper/update-helper.exe` with `pkg`.

### Windows package

```bash
pnpm build:win
```

What it does:

- cleans `dist/` and `out/`
- reinstalls dependencies with `--frozen-lockfile`
- runs the normal app build
- builds `update-helper.exe`
- creates a Windows unpacked app with electron-builder
- verifies `resources/update-helper/update-helper.exe` is included
- zips `dist/win-unpacked` into `releases/`
- opens the unpacked output folder after a successful build

### macOS package

```bash
pnpm build:mac
```

What it does:

- cleans `dist/` and `out/`
- reinstalls dependencies with `--frozen-lockfile`
- runs the normal app build
- creates a macOS arm64 bundle with electron-builder
- applies ad-hoc signing for local execution

### Windows release draft

```bash
pnpm release:win
```

This script assumes:

- a clean git working tree
- the current branch is pushed
- `gh` CLI is installed and authenticated

It builds the Windows artifact and creates or updates a draft GitHub release.

## Windows Update Flow

Downtube includes an in-app Windows update flow exposed from the settings screen.

High-level behavior:

- `app:check-for-updates` loads the latest GitHub release metadata
- `app:download-update` downloads the Windows portable zip into the app update cache
- the zip is extracted into a versioned cache directory
- `app:apply-update` prepares an apply plan and copies `update-helper.exe` into the version cache
- the helper waits for the app to quit, replaces the installed files, and launches the updated executable
- the next app boot cleans helper/apply artifacts from the update cache

Scope notes:

- update download and apply are currently supported on Windows only
- helper-specific types and file preparation live under `src/main/updates`
- the packaged app includes `resources/update-helper/update-helper.exe` through the `build.extraResources` configuration in `package.json`

## Settings and Localization

Persisted settings are stored through `electron-store` and validated in the main process.

| Setting                      | Values                                      |
| ---------------------------- | ------------------------------------------- |
| App language                 | `system`, `ko`, `en`                        |
| App theme                    | `system`, `light`, `dark`                   |
| App theme preset             | `default`, `slate`, `ink`, `jade`, `aurora` |
| Player volume                | —                                           |
| Player muted state           | —                                           |
| Audio visualizer visibility  | —                                           |
| Ambient particles visibility | —                                           |
| Default download type        | `video`, `audio`                            |
| Playlist limit               | —                                           |
| Recent URL history           | —                                           |

Language flow:

- the stored value is a language preference
- the effective app language is resolved in the main process
- if the preference is `system`, the app normalizes the OS language to `ko` or `en`
- the resolved language is applied before React renders, so the splash screen and the main UI start in the same language

Theme flow:

- theme mode and preset are stored separately
- `system` mode follows `prefers-color-scheme` in the renderer
- `system` mode uses the default preset
- manual light and dark modes expose `default`, `slate`, `ink`, `jade`, and `aurora`

## Project Structure

```text
src
├── main
│   ├── common
│   ├── downloads
│   ├── ipc-handlers
│   ├── library
│   ├── settings
│   └── updates
│       ├── adapters
│       ├── application
│       └── shared
├── preload
├── renderer
│   └── app
│       ├── features
│       │   ├── downloads
│       │   ├── library
│       │   ├── player
│       │   ├── settings
│       │   └── splash
│       ├── pages
│       ├── shared
│       ├── styles
│       └── theme
├── types
└── update-helper
```

## Main IPC Channels

The preload bridge in [`src/preload/index.ts`](./src/preload/index.ts) is the source of truth.

| Area         | Channel                     | Direction        | Purpose                                                       |
| ------------ | --------------------------- | ---------------- | ------------------------------------------------------------- |
| app          | `app:init`                  | renderer -> main | Run startup initialization and report progress                |
| app          | `app:get-runtime-info`      | renderer -> main | Read version, platform, packaging, and install directory info |
| app          | `app:get-prepared-update`   | renderer -> main | Read the current prepared update cache                        |
| updates      | `app:check-for-updates`     | renderer -> main | Check the latest Windows release metadata                     |
| updates      | `app:download-update`       | renderer -> main | Download and extract an update package                        |
| updates      | `app:apply-update`          | renderer -> main | Start the helper-based apply flow                             |
| updates      | `app:update-event`          | main -> renderer | Push update progress and error events                         |
| app          | `app:init-state`            | main -> renderer | Push startup initialization progress                          |
| settings     | `settings:get`              | renderer -> main | Read a single persisted setting                               |
| settings     | `settings:get-many`         | renderer -> main | Read multiple settings at once                                |
| settings     | `settings:set`              | renderer -> main | Save a setting after validation                               |
| settings     | `settings:resolve-language` | renderer -> main | Resolve `system`, `ko`, or `en` to the effective app language |
| downloads    | `download-video`            | renderer -> main | Add a video job                                               |
| downloads    | `download-audio`            | renderer -> main | Add an audio job                                              |
| downloads    | `download-playlist`         | renderer -> main | Parse a playlist and enqueue items                            |
| downloads    | `download-set-type`         | renderer -> main | Change the type of a queued job                               |
| downloads    | `download-stop`             | renderer -> main | Stop a queued or running job                                  |
| downloads    | `download-remove`           | renderer -> main | Remove a non-running job                                      |
| downloads    | `downloads-list`            | renderer -> main | Fetch current jobs                                            |
| downloads    | `downloads-start`           | renderer -> main | Start or resume the queue                                     |
| downloads    | `downloads-pause`           | renderer -> main | Pause the queue and stop the current job                      |
| downloads    | `downloads:event`           | main -> renderer | Push queue and job updates                                    |
| library      | `library-list`              | renderer -> main | Scan completed media under the app download directory         |
| library      | `library-delete`            | renderer -> main | Delete a media file and related sidecars                      |
| player/files | `player-open`               | renderer -> main | Open the player window for one or more local files            |
| player/files | `download-dir-open`         | renderer -> main | Open the app download directory                               |
| player/files | `downloads-root-open`       | renderer -> main | Open the system downloads root                                |
| player/files | `download-item-open`        | renderer -> main | Reveal or open a downloaded item path                         |
| player/files | `file-exists`               | renderer -> main | Check whether a file exists inside the allowed directory      |
| player/files | `media-sidecar-read`        | renderer -> main | Read sidecar metadata for the player                          |

## Security Notes

- The main browser window runs with `sandbox: true` and `contextIsolation: true`.
- The renderer does not access Electron or Node APIs directly; it goes through `window.api`.
- IPC is restricted to the handlers registered in `src/main/ipc-handlers/ipc.ts`.
- External windows are denied and opened through the system browser with `shell.openExternal`.
- The custom `downtube-media://` protocol only serves files inside the system downloads directory and supports range requests for playback.
- File operations such as player open, sidecar read, library delete, and file existence checks validate that paths stay inside the allowed directory.

## Development Notes

- The app uses a hash router and boots through `/splash`.
- In development, the main window and the player window open DevTools automatically.
- Initialization writes the app log under `Downloads/DownTube/down-tube.log`.
- The app stores media sidecars (`.json`) and thumbnail images next to downloaded files and reuses them in the library and player.
- The settings screen includes runtime info plus a Windows update section backed by the main-process update services.
- The packaged Windows app ships a separate `update-helper.exe`, while the repository keeps its source in `src/update-helper`.

## License

The project source code is distributed under the [MIT License](./LICENSE).

External tools included in or used with the app follow their own licenses.

| Tool    | License                                               | Link                                       |
| ------- | ----------------------------------------------------- | ------------------------------------------ |
| yt-dlp  | Unlicense                                             | [GitHub](https://github.com/yt-dlp/yt-dlp) |
| FFmpeg  | LGPL-2.1-or-later, depending on the distributed build | [ffmpeg.org](https://ffmpeg.org)           |
| ffprobe | Distributed under FFmpeg terms                        | [ffmpeg.org](https://ffmpeg.org)           |

## Usage and Distribution Notice

Downtube provides download and local playback features, but you are responsible for checking:

- whether you own the content or have permission to use it
- the terms of service of the source platform
- the copyright law and related regulations in your jurisdiction

The screenshots and descriptions in this repository are provided only to explain the app itself. They do not imply that content from any particular platform may be downloaded or redistributed freely.

## Contributing

Issues and pull requests are welcome.
Please keep changes aligned with the current Electron main / preload / renderer separation and the existing feature boundaries.
