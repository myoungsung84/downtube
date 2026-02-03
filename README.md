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

| 채널                  | 설명                                  |
| --------------------- | ------------------------------------- |
| `download-video`      | 비디오 다운로드 큐 추가               |
| `download-audio`      | 오디오 다운로드 큐 추가               |
| `download-playlist`   | 플레이리스트 항목 큐 추가             |
| `download-set-type`   | 대기 항목 타입 변경                   |
| `download-stop`       | 다운로드 중단                         |
| `download-remove`     | 큐/리스트에서 항목 제거               |
| `downloads-list`      | 현재 큐 목록 조회                     |
| `downloads-start`     | 큐 시작/재개                          |
| `downloads-pause`     | 큐 일시정지                           |
| `downloads:event`     | 큐 이벤트 스트림 (job-added/updated)  |
| `download-player`     | 플레이어 윈도우 열기                  |
| `download-dir-open`   | 다운로드 폴더 열기                    |

## 개발 팁

### 개발 도구 활성화

개발 모드에서는 DevTools가 자동으로 열립니다.

### 디렉토리 구조 이해

- main/: Node.js 기반 백엔드 (파일 시스템, 프로세스 관리)
- renderer/: React 기반 UI (사용자 인터페이스)
- preload/: 두 영역 간의 보안 통신 브릿지

## 라이선스

MIT

### 라이선스 주의사항

이 프로젝트는 MIT 라이선스를 따르지만, 다음 외부 도구들의 라이선스를 준수해야 합니다:

- **yt-dlp**: Public Domain (Unlicense)
- **FFmpeg**: LGPL-2.1+ 또는 GPL-2.0+ (빌드 옵션에 따라 다름)

#### 사용자 책임

- YouTube 영상 다운로드 시 해당 영상의 저작권과 약관을 확인하세요.
- YouTube 이용약관에 따라 개인적인 용도의 다운로드만 허용될 수 있습니다.
- 상업적 사용이나 재배포 전에 저작권 소유자의 동의를 받으세요.
- 이 도구로 인한 저작권 침해에 대해 개발자는 책임지지 않습니다.

## 기여

이슈 및 풀 리퀘스트는 언제든 환영합니다.
