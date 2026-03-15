# Downtube

YouTube 영상을 최고화질로 다운로드할 수 있는 Electron 기반 데스크톱 애플리케이션입니다.

## 주요 기능

- **최고화질 다운로드**: 비디오/오디오를 병합하여 MKV 저장
- **오디오 전용 다운로드**: MP3 추출 다운로드
- **플레이리스트 다운로드**: 목록을 한 번에 큐에 추가
- **큐 기반 다운로드**: 시작/일시정지/중단/재시도
- **다운로드 진행률**: 실시간 진행 상황 표시
- **테마 모드 지원**: 라이트/다크/시스템 테마 전환
- **자동 업데이트**: yt-dlp 최신 버전 자동 확인 및 업데이트

## 기술 스택

- **Frontend**: React 19 + TypeScript + React Router
- **Desktop**: Electron 35 + electron-vite
- **Processing**: FFmpeg + yt-dlp
- **Styling**: Material-UI (MUI) + Emotion
- **Build**: electron-builder

## 필수 요구사항

- **Node.js** 18+ (pnpm 사용)
- **Windows** (64-bit), **macOS**, 또는 **Linux**

## 시작하기

### 1. 프로젝트 설치

```bash
pnpm install
```

### 2. 개발 모드 실행

```bash
pnpm dev
```

### 3. 타입 체크

```bash
pnpm typecheck          # 전체 타입 체크
pnpm typecheck:node     # Node 부분만 체크
pnpm typecheck:web      # React 부분만 체크
```

### 4. 코드 포매팅 및 린팅

```bash
pnpm format             # Prettier + ESLint --fix (import 정렬 포함)
pnpm lint               # ESLint 검사
```

## 빌드

### 공통 번들 빌드

```bash
pnpm build
```

### 플랫폼 패키징 스크립트

```bash
pnpm build:win
pnpm build:mac
```

또는 `scripts/build-tools/` 아래 셸 스크립트를 직접 실행할 수 있습니다.

> 참고: 현재 `package.json`에는 `build:linux` 스크립트가 정의되어 있지 않습니다.

## 프로젝트 구조

```
src/
├── main/                          # Electron Main Process
│   ├── index.ts                   # 앱 초기화 및 윈도우 생성
│   ├── common/
│   │   ├── initialize-app.ts      # 앱 초기화/업데이트 관련 로직
│   │   └── register-media-protocol.ts
│   ├── downloads/                 # 다운로드 도메인 모듈
│   │   ├── adapters/              # 외부 도구/파일시스템 연동
│   │   │   ├── ffmpeg/
│   │   │   │   └── ffmpeg.ts
│   │   │   ├── fs/
│   │   │   │   ├── cleanup.ts
│   │   │   │   └── resolver.ts
│   │   │   └── yt-dlp/
│   │   │       ├── yt-dlp.ts
│   │   │       ├── yt-dlp-info.ts
│   │   │       └── yt-dlp-playlist.ts
│   │   ├── application/          # 다운로드 흐름/큐 orchestration
│   │   │   ├── download-queue.ts
│   │   │   ├── run-download-job.ts
│   │   │   └── stop-download-job.ts
│   │   ├── shared/
│   │   │   └── download-helpers.ts
│   │   ├── index.ts
│   │   └── types.ts
│   └── ipc-handlers/
│       └── ipc.ts                 # 다운로드/플레이어/초기화 IPC 등록
├── preload/                       # Preload Script (IPC 통신 브릿지)
│   └── index.ts
├── renderer/                      # React UI
│   └── app/
│       ├── app.tsx                # App 엔트리
│       ├── main.tsx               # 렌더러 부트스트랩
│       ├── themed-app.tsx         # 동적 테마 적용 루트
│       ├── router.tsx
│       ├── features/
│       │   ├── downloads/         # 다운로드 화면/컴포넌트
│       │   └── player/            # 플레이어 화면
│       ├── shared/                # 공용 UI/훅/프로바이더
│       ├── pages/                 # 페이지 구성
│       ├── styles/                # 전역 스타일
│       └── theme/                 # MUI 테마
├── types/                         # 공용 TypeScript 타입 정의
└── libs/
    └── utils.ts
```

## 보안 설정

- Sandbox 활성화: 렌더 프로세스의 권한 제한
- Context Isolation: 프리로드 API를 통한 IPC 통신만 허용
- 외부 링크: 기본 브라우저에서 열기
- 민감한 정보: 환경변수나 API 키 미포함

## 주요 IPC 채널

| 채널                | 설명                                                   |
| ------------------- | ------------------------------------------------------ |
| `download-video`    | 비디오 다운로드 작업 추가                              |
| `download-audio`    | 오디오 전용 다운로드 작업 추가                         |
| `download-playlist` | 플레이리스트 항목을 큐에 추가 (타입/limit/prefix 지원) |
| `download-set-type` | 대기 중인 작업의 다운로드 타입 변경                    |
| `download-stop`     | 실행 중 또는 대기 중 작업 중단                         |
| `download-remove`   | 큐에서 작업 제거 (실행 중 제외)                        |
| `downloads-list`    | 현재 다운로드 목록 조회                                |
| `downloads-start`   | 다운로드 큐 시작 또는 재개                             |
| `downloads-pause`   | 다운로드 큐 일시정지                                   |
| `downloads:event`   | 다운로드 큐 이벤트 스트림 구독                         |
| `download-player`   | 플레이어 창 열기                                       |
| `download-dir-open` | 다운로드 폴더 열기                                     |

## 개발 팁

### 개발 도구 활성화

개발 모드에서는 DevTools가 자동으로 열립니다.

### 디렉토리 구조 이해

- main/: Electron 메인 프로세스 로직 (IPC, 다운로드 실행, 파일/프로세스 관리)
- main/ipc-handlers: preload API와 연결되는 IPC 채널 등록 레이어
- main/downloads: 다운로드 도메인 모듈 (application / adapters / shared)
  - application: 다운로드 큐, 실행 흐름, 중단 처리 같은 orchestration 담당
  - adapters: yt-dlp / ffmpeg / 파일시스템 등 외부 도구 및 IO 연동 담당
  - shared: 다운로드 모듈 내부에서 공통으로 쓰는 helper 담당
- renderer/: React 기반 UI (사용자 인터페이스)
- preload/: 메인/렌더러 간 보안 통신 브릿지

### IPC 구조 메모

- `preload/index.ts`, `preload/index.d.ts`
  - 렌더러에서 사용할 `window.api` 브릿지와 타입 정의를 제공합니다.
- `main/ipc-handlers/ipc.ts`
  - preload에서 노출한 API에 대응하는 실제 IPC 핸들러를 등록합니다.
- 현재 IPC는 크게 다음 흐름으로 나뉩니다.
  - 다운로드 큐 제어: 추가, 일시정지, 재개, 중단, 제거, 타입 변경
  - 다운로드 상태 구독: `downloads:event`
  - 플레이어 연동: 플레이어 창 열기, 다운로드 폴더/파일 열기, 미디어 메타 조회
  - 앱 초기화: `initApp`, `onInitState`

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
