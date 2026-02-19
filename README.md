# Downtube

YouTube 영상을 최고화질로 다운로드할 수 있는 Electron 기반 데스크톱 애플리케이션입니다.

## 주요 기능

- **최고화질 다운로드**: 비디오/오디오를 병합하여 MKV 저장
- **오디오 전용 다운로드**: MP3 추출 다운로드
- **플레이리스트 다운로드**: 목록을 한 번에 큐에 추가
- **큐 기반 다운로드**: 시작/일시정지/중단/재시도
- **다운로드 진행률**: 실시간 진행 상황 표시
- **자동 업데이트**: yt-dlp 최신 버전 자동 확인 및 업데이트

## 기술 스택

- **Frontend**: React 19 + TypeScript + React Router
- **Desktop**: Electron 35 + electron-vite
- **Processing**: FFmpeg + yt-dlp
- **Styling**: Material-UI (MUI) + Emotion
- **Build**: electron-builder

## 필수 요구사항

- **Node.js** 18+ (npm 포함)
- **Windows** (64-bit), **macOS**, 또는 **Linux**

## 시작하기

### 1. 프로젝트 설치

```bash
npm install
```

### 2. 개발 모드 실행

```bash
npm run dev
```

### 3. 타입 체크

```bash
npm run typecheck          # 전체 타입 체크
npm run typecheck:node     # Node 부분만 체크
npm run typecheck:web      # React 부분만 체크
```

### 4. 코드 포매팅 및 린팅

```bash
npm run format             # Prettier 포매팅
npm run lint               # ESLint 검사
```

## 빌드

> 주의: 빌드는 반드시 제공된 빌드 스크립트를 사용해야 합니다.

### Windows (64-bit)

```bash
./build-win.sh
```

### macOS (ARM64 & x86)

```bash
./build-mac.sh
# 또는 특정 아키텍처만 빌드
npm run build:mac:arm64    # Apple Silicon
npm run build:mac:x64      # Intel Mac
```

### Linux

```bash
npm run build:linux
```

## 프로젝트 구조

```
src/
├── main/                          # Electron Main Process
│   ├── index.ts                   # 앱 초기화 및 윈도우 생성
│   ├── common/
│   │   └── initialize-app.ts      # yt-dlp 자동 업데이트 로직
│   ├── downloads/                 # 다운로드 실행/유틸/큐
│   │   ├── download-queue.ts
│   │   ├── yt-dlp-playlist.ts
│   │   ├── yt-dlp-runner.ts
│   │   └── yt-dlp-utils.ts
│   └── ipc-handlers/
│       └── ipc.ts                 # IPC 핸들러
├── preload/                       # Preload Script (IPC 통신 브릿지)
│   └── index.ts
├── renderer/                      # React UI
│   └── app/
│       ├── app.tsx                # App 엔트리
│       ├── main.tsx               # 렌더러 부트스트랩
│       ├── router.tsx
│       ├── features/
│       │   ├── downloads/         # 다운로드 화면/컴포넌트
│       │   └── player/            # 플레이어 화면
│       ├── shared/                # 공용 UI/훅/프로바이더
│       ├── pages/                 # 페이지 구성
│       ├── styles/                # 전역 스타일
│       └── theme/                 # MUI 테마
├── types/                         # TypeScript 타입 정의
│   └── download.types.ts
└── libs/
    └── utils.ts
```

## 보안 설정

- Sandbox 활성화: 렌더 프로세스의 권한 제한
- Context Isolation: 프리로드 API를 통한 IPC 통신만 허용
- 외부 링크: 기본 브라우저에서 열기
- 민감한 정보: 환경변수나 API 키 미포함

## 주요 IPC 채널

| 채널                | 설명                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `download-video`    | 비디오 다운로드 큐 추가                                          |
| `download-audio`    | 오디오 다운로드 큐 추가                                          |
| `download-playlist` | 플레이리스트 항목 큐 추가 (limit 적용)                           |
| `download-set-type` | 대기 항목 타입 변경 (queued 상태만 가능)                         |
| `download-stop`     | 다운로드 중단 (running/queued)                                   |
| `download-remove`   | 큐/리스트에서 항목 제거 (running 제외)                           |
| `downloads-list`    | 현재 큐 목록 조회                                                |
| `downloads-start`   | 큐 시작/재개                                                     |
| `downloads-pause`   | 큐 일시정지                                                      |
| `downloads:event`   | 큐 이벤트 스트림 (job-added/job-updated/job-removed/queue-state) |
| `download-player`   | 플레이어 윈도우 열기                                             |
| `download-dir-open` | 다운로드 폴더 열기                                               |

## 개발 팁

### 개발 도구 활성화

개발 모드에서는 DevTools가 자동으로 열립니다.

### 디렉토리 구조 이해

- main/: Node.js 기반 백엔드 (파일 시스템, 프로세스 관리)
- renderer/: React 기반 UI (사용자 인터페이스)
- preload/: 두 영역 간의 보안 통신 브릿지

## 라이선스

DownTube는 **MIT License**로 배포됩니다.

본 애플리케이션은 다음과 같은 외부 오픈소스 도구를 사용하며, 각 도구의 라이선스 조건을 존중합니다:

- **yt-dlp**

  - License: Public Domain (Unlicense)
  - Repository: https://github.com/yt-dlp/yt-dlp

- **FFmpeg**
  - License: LGPL-2.1+ 또는 GPL-2.0+ (빌드 설정에 따라 다름)
  - Website: https://ffmpeg.org

### 라이선스 및 사용 관련 안내

- DownTube의 소스 코드는 MIT 라이선스를 따르며, 위에 명시된 외부 도구들은 독립적인 실행 파일로 사용됩니다.
- 외부 도구들의 라이선스 조건은 각 프로젝트의 정책을 따릅니다.
- 일부 백신 소프트웨어에서 본 애플리케이션 또는 포함된 외부 도구를 오탐지(false positive)로 분류할 수 있습니다.

### 사용자 책임

- YouTube 및 기타 플랫폼의 콘텐츠를 다운로드할 경우, 해당 콘텐츠의 저작권과 서비스 약관을 반드시 확인해야 합니다.
- 개인적인 용도를 넘어서는 사용(상업적 이용, 재배포 등)은 저작권 소유자의 사전 동의가 필요할 수 있습니다.
- 본 애플리케이션을 사용하여 발생하는 저작권 침해 또는 약관 위반에 대한 책임은 사용자에게 있습니다.

## 기여

이슈 및 풀 리퀘스트는 언제든지 환영합니다.
