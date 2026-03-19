# CLAUDE.md

이 문서는 Downtube 저장소에서 Claude Code가 작업할 때 따라야 할 추가 규칙을 정리한다.
공통 프로젝트 규칙은 반드시 `AGENTS.md`를 기준으로 따르고, 이 문서는 Claude 작업 흐름에 필요한 보강 규칙만 다룬다.

## 1. 기본 원칙

- 먼저 `AGENTS.md`를 읽고 그 규칙을 기본 기준으로 따른다.
- 이 문서와 `AGENTS.md`가 충돌하면, 특별히 사용자 지시가 없는 한 `AGENTS.md`를 우선한다.
- 과한 추상화보다 읽기 쉽고 유지보수 가능한 구조를 우선한다.
- 한 번에 크게 갈아엎지 말고, 범위를 잘라서 안전하게 수정한다.
- 의미 없는 공용 컴포넌트, 래퍼, 상수 파일을 늘리지 않는다.

## 2. renderer 작업 규칙

- `pages/`는 라우트 껍데기 전용으로 유지한다.
- 실제 화면 구현은 `features/*/screens/`에서 처리한다.
- 화면 전용 UI 조각은 `features/*/components/`에서 우선 해결한다.
- 공용 UI/훅/프로바이더는 `shared/` 아래에서만 다룬다.
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

## 3. UX 작업 규칙

- UX 작업은 "화려함"보다 "정돈감"과 "일관성"을 우선한다.
- 애니메이션은 꼭 필요한 경우에만 아주 절제되게 사용한다.
- 큰 이동, bounce, 과한 scale, 과한 glow는 피한다.
- spacing은 값을 전부 통일하는 것이 아니라, 책임 위치를 정리하는 방식으로 다룬다.
  - 화면 레벨: screen padding, header/body 간격, 큰 섹션 간격
  - 섹션 레벨: 패널/블록 간 gap
  - 컴포넌트 레벨: 패널 내부 padding, row 내부 spacing
  - 미세 정렬 레벨: 텍스트/아이콘/배지 소간격
- Typography는 기본적으로 직접 사용하고, 역할이 명확할 때만 제한적으로 패턴화한다.
- `Label.tsx`, `Text.tsx`, `AppTypography.tsx` 같은 범용 Typography 래퍼는 만들지 않는다.
- `spacing.ts`, `ux-tokens.ts` 같은 파일을 단순 통일 목적만으로 새로 만들지 않는다.

## 4. PR / 브랜치 규칙

- Claude 작업은 별도 작업 브랜치와 worktree에서 진행할 수 있다.
- 하지만 PR 생성 시 base branch는 반드시 현재 사용자가 작업 기준으로 지정한 브랜치를 사용한다.
- 사용자가 별도 작업 브랜치를 지정하지 않았다면 그때만 `main`을 기본 base로 본다.
- PR을 만들 때는 무조건 `main`으로 보내지 말고 현재 작업 문맥의 기준 브랜치를 먼저 확인한다.
- PR 제목과 본문은 실제 수정 범위를 과장하지 않는다.
- 일부 화면만 수정했으면 전체 renderer를 정리한 것처럼 쓰지 않는다.

## 5. 변경 범위 판단 기준

- 먼저 전체 구조를 훑고, 실제 수정은 필요한 범위만 최소한으로 반영한다.
- 이미 기준이 잘 잡힌 화면은 억지로 손대지 않는다.
- 예외 구조가 분명한 화면은 공통 규격에 억지로 맞추지 않는다.
  - 예: fullscreen player
- 시각 토큰 정리, 지역 상수 정리, 중복 sx 제거처럼 안전한 정리는 우선 가능하다.
- 기능/이벤트/상태 흐름을 건드리는 수정은 더 보수적으로 접근한다.

## 6. 보고 규칙

- 최종 보고는 반드시 코드블록으로 작성한다.
- 보고에는 아래 항목을 상황에 맞게 포함한다.

```text
[done]
- 검토한 범위:
  -
- 이번에 실제 반영한 항목:
  -
- 수정한 파일:
  -
- 왜 이 범위까지만 반영했는지:
  -
- 영향 범위:
  -
- 확인 포인트:
  -
- 남은 이슈 / 선택 사항:
  -
```

- 사용자가 PR 관련 작업을 요청한 경우에는 아래 항목도 함께 보고한다.

```text
- head branch:
  -
- base branch:
  -
- pr title:
  -
```

## 7. 네이밍 규칙

- main, preload, renderer feature 파일은 kebab-case를 사용한다.
- React 컴포넌트 export 이름은 PascalCase를 사용한다.
- settings key는 점 표기 문자열을 유지한다. 예: `downloads.defaultType`
- 공용 타입은 가능하면 `src/types`에 두고, main 내부 전용 타입은 해당 도메인 아래에 둔다.

## 8. 검증 규칙

- 코드 수정 후 아래 순서로 검증한다.
  1. `pnpm format`
  2. `pnpm typecheck`
  3. 필요 시 `pnpm lint`
  4. 배포 전 확인은 `pnpm build`
- import 정렬, unused import, React hook dependency 경고는 그대로 두지 않는다.
- 포맷 경고만 있는 경우 스타일을 우회하지 말고 `pnpm format`으로 먼저 맞춘다.
- settings 변경 시 renderer에서만 타입을 맞추고 `settings-validator.ts`를 빠뜨리지 않는다.

## 9. 릴리즈 노트 규칙

- 사용자가 `rn` 또는 `릴리즈 노트 작성`을 요청하면 반드시 먼저 템플릿 파일을 직접 읽고 그 본문을 기준으로 작성한다.
  - 템플릿: `docs/release/release-note-template-win.md`
- 버전은 반드시 `package.json`의 `version` 값을 기준으로 사용한다.
- 변경 가능한 값은 `version`, `added`, `improved`, `fixed` 4개뿐이다. 나머지 문구·섹션 순서는 템플릿 그대로 유지한다.
- 항목은 사용자 관점 문장으로 작성하고, 내부 구현 세부사항이나 파일명은 넣지 않는다.
- 최종 결과는 반드시 하나의 코드블록 안에 넣어 전달한다. 불필요한 설명은 코드블록 안에 넣지 않는다.
- 이전 대화에서 사용했던 릴리즈 노트 형식이나 과거 문구를 그대로 재사용하지 않는다.

## 10. 금지 사항

- 사용자가 요청하지 않은 대규모 리팩터링 금지
- 의미 없는 공용화 금지
- 무리한 파일 분리 금지
- `main` 대상으로 성급하게 PR 생성 금지
- 실제 수정 범위를 넘어서는 과장된 보고 금지
- renderer에서 `window.api` 우회 금지
- IPC 추가 시 4개 파일 중 일부만 수정하는 것 금지
- settings 변경 시 validator 누락 금지
- import 정렬·unused import 방치 금지
