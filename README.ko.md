[English](./README.md)

# Downtube

<p align="center">
  <img src="./assets/screenshot-main-ko.png" alt="Downtube 메인 화면" width="680" />
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/electron-35-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React" />
</p>

Downtube는 큐 기반 다운로드와 로컬 재생을 묶은 개인 Electron 데스크톱 앱입니다.
현재 저장소 기준으로 다운로드 화면, 완료 항목 보관함, 내장 플레이어, 다국어 UI, 설정 저장 흐름이 함께 구현되어 있습니다.

> 이 프로젝트는 직접 소유한 콘텐츠, 공개 라이선스 콘텐츠, 또는 사용 권한이 있는 콘텐츠를 대상으로 사용하는 것을 전제로 합니다.

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [요구사항](#요구사항)
- [시작하기](#시작하기)
- [빌드 및 패키징](#빌드-및-패키징)
- [설정 및 언어 처리](#설정-및-언어-처리)
- [프로젝트 구조](#프로젝트-구조)
- [주요 IPC 채널](#주요-ipc-채널)
- [보안 메모](#보안-메모)
- [개발 메모](#개발-메모)
- [라이선스](#라이선스)
- [사용 및 배포 안내](#사용-및-배포-안내)
- [기여](#기여)

## 주요 기능

- 비디오와 오디오 다운로드를 같은 큐에서 관리
- 플레이리스트 URL 파싱 후 일괄 큐 추가
- 다운로드 시작, 일시정지, 중단, 제거, 재시도 지원
- 대기 중 작업의 다운로드 타입 전환
- 최근 URL 기록 저장
- 앱 다운로드 디렉터리 기준의 완료 항목 보관함
- 로컬 비디오/오디오 재생용 내장 플레이어
- 탐색, 볼륨, 음소거, 재생 속도, 전체화면, 오디오 시각화 컨트롤
- 테마, 언어, 기본 다운로드 타입, 플레이리스트 개수 제한 설정
- 한국어/영어 UI와 `system` 언어 설정 지원
- 최종 적용 언어를 React 첫 렌더 전에 확정해 splash와 메인 화면이 같은 언어로 시작
- 시작 시 번들 바이너리를 점검하고 필요하면 Windows/macOS에서 `yt-dlp`를 런타임에 내려받는 초기화 흐름

## 기술 스택

| 분류            | 기술                                   |
| --------------- | -------------------------------------- |
| 데스크톱 런타임 | Electron, electron-vite                |
| Renderer        | React 19, React Router, TypeScript     |
| UI              | MUI, Emotion                           |
| 상태 관리       | Zustand                                |
| 다국어          | i18next, react-i18next                 |
| 미디어 도구     | yt-dlp, FFmpeg, ffprobe, fluent-ffmpeg |
| 설정 저장       | electron-store                         |
| 빌드            | electron-builder                       |

## 요구사항

- Node.js
- pnpm
- 현재 유지 중인 패키징 스크립트 기준으로 Windows 또는 macOS
- WSL 같은 환경에서 `pnpm build:win`을 실행하려면 `powershell.exe`
- `pnpm release:win`을 쓰려면 `gh` CLI

메모:

- 현재 renderer 입력 검증은 YouTube 비디오/플레이리스트 URL 기준으로 동작합니다.
- 번들 바이너리 준비 스크립트는 Windows/macOS를 기준으로 작성되어 있습니다. Linux 패키징 스크립트는 `package.json`에 정의되어 있지 않습니다.

## 시작하기

### 1. 저장소 클론

```bash
git clone <your-repository-url>
cd downtube
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 개발 모드 실행

```bash
pnpm dev
```

### 4. 자주 쓰는 개발 명령

```bash
pnpm typecheck
pnpm lint
pnpm format
pnpm clean
```

### 5. 필요 시 번들 도구 갱신

```bash
pnpm tools:ensure
```

`tools:ensure`는 `ffmpeg`, `ffprobe`를 `bin/`에 준비하고, 지원 플랫폼에서 `yt-dlp`가 없으면 내려받습니다.

## 빌드 및 패키징

### 앱 빌드

```bash
pnpm build
```

현재 흐름:

1. `scripts/build-tools/ensure-tools.sh`
2. `pnpm typecheck`
3. `electron-vite build`

### Windows 패키지

```bash
pnpm build:win
```

현재 스크립트 동작:

- `dist/`, `out/` 정리
- `--frozen-lockfile` 기준 재설치
- 앱 빌드
- Windows unpacked 빌드 생성
- `dist/win-unpacked`를 `releases/` 아래 zip으로 압축

### macOS 패키지

```bash
pnpm build:mac
```

현재 스크립트 동작:

- `dist/`, `out/` 정리
- `--frozen-lockfile` 기준 재설치
- 앱 빌드
- macOS arm64 앱 번들 생성
- 로컬 실행용 ad-hoc codesign 적용

### Windows 릴리즈 초안

```bash
pnpm release:win
```

이 스크립트는 아래 조건을 전제로 합니다.

- git working tree가 깨끗할 것
- 현재 브랜치가 origin과 동기화되어 있을 것
- `gh` CLI가 설치되어 있고 인증되어 있을 것

빌드 후 Windows 아티팩트를 업로드하고 GitHub draft release를 생성하거나 갱신합니다.

## 설정 및 언어 처리

설정은 `electron-store`로 저장되고, main process에서 검증됩니다.

현재 저장되는 설정:

- 앱 언어: `system`, `ko`, `en`
- 앱 테마: `system`, `light`, `dark`
- 플레이어 볼륨
- 플레이어 음소거 상태
- 플레이어 오디오 시각화 표시 여부
- 기본 다운로드 타입: `video` 또는 `audio`
- 플레이리스트 개수 제한
- 최근 URL 기록

언어 처리 흐름:

- 저장값은 언어 preference입니다.
- 실제 적용 언어는 main process에서 resolve합니다.
- `system`이면 OS 언어를 읽어 `ko` 또는 `en`으로 정규화합니다.
- resolve된 언어를 React 렌더 전에 먼저 적용하므로 splash와 메인 UI가 같은 언어로 시작합니다.

테마 처리 흐름:

- 테마 preference는 설정에 저장됩니다.
- `system` 테마는 renderer의 `prefers-color-scheme`를 따릅니다.

## 프로젝트 구조

```text
src/main
  Electron main process 진입점, 창 생성, 프로토콜 등록, IPC 핸들러,
  다운로드 실행, 보관함 스캔, 설정 검증/저장 담당.

src/preload
  renderer에 노출할 `window.api` 브릿지를 정의.

src/renderer/app/features/downloads
  URL 입력, 최근 기록, 큐 상태, 작업별 액션 UI.

src/renderer/app/features/library
  완료된 미디어 목록, 항목 액션, 삭제 흐름.

src/renderer/app/features/player
  로컬 미디어 재생, sidecar 메타데이터 로딩, 플레이어 컨트롤, 시각화.

src/renderer/app/features/settings
  테마, 언어, 기본 타입, 플레이리스트 제한 설정 UI.

src/renderer/app/features/splash
  초기화 진행 상태와 시작 오류 표시.

src/renderer/app/shared
  내비게이션, provider, hook, i18n, 공용 UI, 유틸리티.

src/types
  main, preload, renderer가 함께 쓰는 공용 타입.

bin
  `yt-dlp`, `ffmpeg`, `ffprobe` 같은 런타임 도구 번들 경로.
```

## 주요 IPC 채널

실제 노출 API 기준은 [`src/preload/index.ts`](./src/preload/index.ts)입니다. 아래 표는 현재 앱에서 핵심으로 쓰는 채널을 정리한 것입니다.

| 영역         | 채널                        | 방향             | 용도                                     |
| ------------ | --------------------------- | ---------------- | ---------------------------------------- | --- | --------------------------- |
| app          | `app:init`                  | renderer -> main | 시작 초기화 실행 및 진행 상태 보고       |
| settings     | `settings:get`              | renderer -> main | 단일 설정 조회                           |
| settings     | `settings:get-many`         | renderer -> main | 여러 설정 일괄 조회                      |
| settings     | `settings:set`              | renderer -> main | 검증 후 설정 저장                        |
| settings     | `settings:resolve-language` | renderer -> main | `system                                  | ko  | en`을 실제 적용 언어로 해석 |
| downloads    | `download-video`            | renderer -> main | 비디오 작업 추가                         |
| downloads    | `download-audio`            | renderer -> main | 오디오 작업 추가                         |
| downloads    | `download-playlist`         | renderer -> main | 플레이리스트 파싱 후 큐 추가             |
| downloads    | `download-set-type`         | renderer -> main | 대기 중 작업 타입 변경                   |
| downloads    | `download-stop`             | renderer -> main | 대기 중 또는 실행 중 작업 중단           |
| downloads    | `download-remove`           | renderer -> main | 실행 중이 아닌 작업 제거                 |
| downloads    | `downloads-list`            | renderer -> main | 현재 작업 목록 조회                      |
| downloads    | `downloads-start`           | renderer -> main | 큐 시작 또는 재개                        |
| downloads    | `downloads-pause`           | renderer -> main | 큐 일시정지 및 현재 작업 중단            |
| downloads    | `downloads:event`           | main -> renderer | 큐/작업 상태 이벤트 전달                 |
| library      | `library-list`              | renderer -> main | 앱 다운로드 디렉터리 기준 완료 항목 스캔 |
| library      | `library-delete`            | renderer -> main | 미디어 파일과 관련 sidecar 삭제          |
| player/files | `download-player`           | renderer -> main | 완료 작업 기준 플레이어 창 열기          |
| player/files | `download-player-file`      | renderer -> main | 파일 경로 기준 플레이어 창 열기          |
| player/files | `download-dir-open`         | renderer -> main | 앱 다운로드 디렉터리 열기                |
| player/files | `downloads-root-open`       | renderer -> main | 시스템 Downloads 루트 열기               |
| player/files | `download-item-open`        | renderer -> main | 다운로드 항목 경로 열기                  |
| player/files | `media-sidecar-read`        | renderer -> main | 플레이어용 sidecar 메타데이터 읽기       |

## 보안 메모

- 메인 창은 `sandbox: true`, `contextIsolation: true`로 실행됩니다.
- renderer는 Electron/Node API에 직접 접근하지 않고 `window.api`만 사용합니다.
- IPC는 `src/main/ipc-handlers/ipc.ts`에 등록된 채널만 허용됩니다.
- 외부 링크 새 창은 차단하고 `shell.openExternal`로 시스템 브라우저에서 엽니다.
- `downtube-media://` 커스텀 프로토콜은 시스템 Downloads 디렉터리 내부 파일만 서빙하며 range request를 지원합니다.
- 플레이어 열기, sidecar 읽기, 보관함 삭제 같은 파일 작업은 허용된 경로 내부인지 검증합니다.

## 개발 메모

- 앱은 hash router를 사용하고 `/splash`에서 부팅합니다.
- splash는 앱 나머지 화면과 동일한 최종 적용 언어로 첫 렌더됩니다.
- 초기화 과정에서 로그 파일은 `Downloads/DownTube/down-tube.log`에 기록됩니다.
- 개발 모드에서는 메인 창과 플레이어 창이 자동으로 DevTools를 엽니다.
- 다운로드가 완료되면 `.json` sidecar와 썸네일 파일을 함께 저장하고, 보관함과 플레이어가 이를 재사용합니다.

## 라이선스

프로젝트 소스 코드는 [MIT License](./LICENSE)를 따릅니다.

앱에 포함되거나 함께 사용되는 외부 도구는 각자 별도 라이선스를 따릅니다.

| 도구    | 라이선스                                | 링크                                       |
| ------- | --------------------------------------- | ------------------------------------------ |
| yt-dlp  | Unlicense                               | [GitHub](https://github.com/yt-dlp/yt-dlp) |
| FFmpeg  | 배포 빌드에 따라 LGPL-2.1-or-later 기준 | [ffmpeg.org](https://ffmpeg.org)           |
| ffprobe | FFmpeg 배포 조건을 따름                 | [ffmpeg.org](https://ffmpeg.org)           |

## 사용 및 배포 안내

Downtube는 다운로드와 로컬 재생 기능을 제공하지만, 아래 사항은 사용자가 직접 확인해야 합니다.

- 콘텐츠에 대한 소유권 또는 사용 허가 여부
- 원본 플랫폼의 서비스 약관
- 사용 지역의 저작권 및 관련 법규

이 저장소의 스크린샷과 설명은 앱 자체를 소개하기 위한 것이며, 특정 플랫폼 콘텐츠를 자유롭게 다운로드하거나 재배포할 수 있다는 의미가 아닙니다.

## 기여

이슈와 풀 리퀘스트는 환영합니다.
변경 시에는 현재의 Electron main / preload / renderer 분리와 기능 경계를 유지해 주세요.
