# AGENTS.md

이 문서는 Downtube 저장소에서 작업할 때 Codex가 따라야 할 프로젝트 작업 규칙을 정리한다. 실제 코드 구조와 스크립트 기준으로 필요한 항목만 적는다.

## 프로젝트 구조

- `src/main`: Electron main process. 다운로드 실행, IPC 등록, 설정 저장, 앱 초기화가 여기에 있다.
- `src/preload`: renderer가 직접 Node/Electron API를 만지지 않도록 `window.api` 브릿지를 노출한다.
- `src/renderer/app`: React UI. `features` 단위로 화면과 상태를 나누고, `shared`에 공용 UI와 훅을 둔다.
- `src/types`: main, preload, renderer가 함께 쓰는 공용 타입이다.
- `scripts/build-tools`: 빌드/정리 스크립트.
- `scripts/release-tools`: 릴리즈 스크립트. 이번 저장소에서는 `release-win.sh`가 기준이다.
- `bin`, `assets`: 패키징 시 포함되는 외부 바이너리와 정적 리소스.

## 작업 원칙

- 수정 범위는 가능한 한 도메인 경계 안에서 끝낸다.
  - main 로직 변경이면 `src/main`과 공용 타입까지만 본다.
  - renderer UI 변경이면 먼저 `src/renderer/app/features/...` 안에서 해결한다.
- renderer에서 Electron/Node API를 직접 호출하지 말고 반드시 `window.api`를 통해 접근한다.
- 새로운 IPC가 필요하면 아래 순서를 지킨다.
  1. `src/main/ipc-handlers/ipc.ts`
  2. `src/preload/index.ts`
  3. `src/preload/index.d.ts`
  4. 필요 시 `src/types`
- 설정 키를 추가하거나 변경할 때는 아래 파일을 같이 수정한다.
  1. `src/types/settings.types.ts`
  2. `src/main/settings/settings-defaults.ts`
  3. `src/main/settings/settings-validator.ts`
  4. renderer 사용처
- 다운로드 도메인 수정 시 UI 로직과 실행 로직을 섞지 않는다.
  - 큐/실행/정지: `src/main/downloads/application`
  - 어댑터: `src/main/downloads/adapters`
  - renderer 화면 상태: `src/renderer/app/features/downloads`

## 네이밍과 배치

- 파일명은 현재 저장소 패턴을 따른다.
  - main, preload, renderer feature 파일은 기본적으로 kebab-case를 사용한다.
  - 공용 UI 파일도 소문자 파일명을 유지한다.
- React 컴포넌트 export 이름은 PascalCase를 사용한다.
- settings key는 점 표기 문자열을 유지한다.
  - 예: `downloads.defaultType`
- 공용 타입은 가능하면 `src/types`에 두고, main 내부 전용 타입은 해당 도메인 아래에 둔다.
- renderer feature 내부 helper는 먼저 해당 feature의 `lib`에 두는 쪽을 우선한다.

## 구현 시 주의점

- 다운로드 기능은 사용자 노출 UI와 실제 다운로드 실행이 분리되어 있다. renderer에서 다운로드 상태를 직접 만들지 말고 queue event를 따른다.
- 다운로드 관련 변경은 중복 주소 처리, 취소/재시도, playlist 경로를 같이 확인한다.
- settings 값은 main validator가 최종 방어선이다. renderer에서만 타입을 맞추고 validator를 빼먹지 않는다.
- preload 브릿지 타입과 구현이 어긋나지 않게 `index.ts`와 `index.d.ts`를 같이 본다.
- 기존 문구 톤은 한국어 중심, 짧고 직접적인 안내 문구를 유지한다.

## 검증 기준

- 기본 검증 순서:
  1. `pnpm typecheck`
  2. 필요 시 `pnpm lint`
  3. 배포 전 확인은 `pnpm build`
- 포맷은 Prettier 기준을 따른다. 포맷 경고만 있는 경우 스타일을 억지로 우회하지 말고 코드 형식을 맞춘다.
- import 정렬, unused import, React hook dependency 경고는 그대로 두지 않는다.

## 릴리즈 노트 규칙

- 사용자가 `rn` 또는 `릴리즈 노트 작성`을 요청하면 Windows 릴리즈 노트를 먼저 기준으로 작성한다.
- 템플릿 경로는 고정이다.
  - `docs/release/release-note-template-win.md`
- 버전은 반드시 `package.json`의 `version` 값을 기준으로 사용한다.
- 템플릿에서 변경 가능한 값은 아래 4개뿐이다.
  - `version`
  - `added`
  - `improved`
  - `fixed`
- 나머지 문구, 섹션 순서, 안내 문장은 템플릿 그대로 유지한다.
- 릴리즈 노트 작성 시:
  - `added`: 새 기능
  - `improved`: 기존 UX/구조/성능 개선
  - `fixed`: 버그 수정
- 항목은 사용자 관점 문장으로 작성하고, 내부 구현 세부사항이나 파일명 나열은 기본적으로 넣지 않는다.
- 이번 저장소에서는 릴리즈 스크립트 자체를 임의로 수정하지 않는다. 릴리즈 노트 작성과 릴리즈 자동화는 분리해서 다룬다.
- Codex가 작업 결과를 보고할 때는 최종 산출물을 항상 코드블럭으로 제공한다.
- 코드블럭 안에는 복사해서 바로 사용할 수 있는 순수 텍스트만 넣는다.
- 불필요한 설명, 제목, 해설, 장식 문구는 코드블럭 안에 넣지 않는다.
- 코드블럭 밖 설명은 최소화하고, 필요하면 파일 목록이나 변경 요약만 짧게 덧붙인다.
