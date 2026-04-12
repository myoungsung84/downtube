---
name: readme-sync
description: 저장소의 실제 최신 소스를 기준으로 README.md와 README.ko.md를 함께 점검하고 동기화할 때 사용하는 전용 skill이다. 문서 문장만 다듬는 용도가 아니라, 현재 코드/폴더 구조/스크립트/package.json 설정 기준으로 README를 검증하고 갱신하는 작업에 사용한다.
---

# Readme Sync

Downtube 저장소에서 README 문서를 실제 코드 기준으로 맞출 때 사용하는 절차다.

## 사용 시점

- 사용자가 `readme-sync`, `README 동기화`, `README 갱신`, `README 업데이트`처럼 README를 최신 코드 기준으로 점검하고 고치라고 요청했을 때 사용한다.
- 단순 오탈자 수정이나 문장 톤 보정보다, 실제 구현/스크립트/구조와 문서의 불일치를 잡는 작업에 우선 사용한다.

## 관리 대상

- 기본 관리 대상은 아래 2개 파일이다.
- `README.md`
- `README.ko.md`
- 두 파일 모두 반드시 검토한다.
- 변경이 필요하면 가능한 한 두 파일의 섹션 구조와 정보 범위를 맞춘다.
- 한쪽만 수정한 경우에는 그 이유를 최종 보고에 명시한다.
- 직역보다 같은 사실을 각 언어에 자연스럽게 맞춰 반영한다.

## 먼저 확인할 소스

- README 수정 전에 반드시 실제 소스를 먼저 확인한다.
- `package.json`
- `src/main`
- `src/preload`
- `src/renderer/app`
- `src/update-helper`
- `scripts/*`
- `package.json`의 `build` 필드를 포함한 electron-builder 관련 설정
- 현재 존재하는 dev/build/release/typecheck/lint/format 스크립트

특히 아래는 우선 확인한다.

- `package.json`의 `scripts`, `build`, `version`, 주요 의존성
- `src/main/ipc-handlers/ipc.ts`
- `src/preload/index.ts`
- `src/preload/index.d.ts`
- `src/main/settings`
- `src/main/updates`
- `src/renderer/app/features`
- `scripts/build-tools`
- `scripts/release-tools`

## 핵심 원칙

- README에 이미 적혀 있는 내용을 진실 소스로 믿지 않는다.
- 최신 코드를 기준으로 검증한 사실만 문서에 반영한다.
- 과장된 마케팅 문구보다 실제 동작, 구조, 제약사항을 우선한다.
- 존재하지 않는 기능은 추가하지 않는다.
- 오래된 설명, 현재 코드와 어긋나는 설명, 제거된 기능 설명은 삭제하거나 갱신한다.
- 프로젝트 구조 설명은 현재 실제 디렉터리 기준으로 갱신한다.
- 디렉터리 존재 여부만 확인하지 말고, README에 반영할 수 있는 실제 구조, 명령어, API, 채널, 스크립트 사실을 코드에서 추출한다.
- IPC 관련 문서는 preload 노출 API 또는 실제 ipc handler 등록 기준으로 검증한다.
- 코드에서 직접 확인되지 않은 내용은 추측해서 넣지 말고, 필요한 경우 최종 보고의 `추가 확인 필요 사항`에 남긴다.
- 빌드, 패키징, 업데이트 관련 설명은 현재 스크립트와 `package.json` 설정 기준으로 검증한다.
- Windows/macOS 차이와 현재 실제 지원 범위는 명확히 적는다.
- 라이선스, 외부 도구 고지, 사용 책임 관련 문구는 유지하되 현재 표현과 충돌하면 정리한다.
- 코드에서 확인되지 않는 내용은 추측해서 쓰지 않는다.

## 우선 점검 항목

- 앱 소개 문구가 현재 기능과 맞는지
- 주요 기능 목록이 최신인지
- tech stack이 최신인지
- requirements가 최신인지
- dev/build/release 명령어가 최신인지
- README 안의 예시 명령어가 실제 현재 스크립트와 맞는지
- README 안의 링크, 배지, 스크린샷, 예시 트리가 현재 저장소 상태와 맞는지
- Windows update flow 설명이 최신인지
- settings / localization 설명이 최신인지
- project structure가 최신인지
- main IPC channels 설명이 최신인지
- security / development notes가 최신인지
- `README.md`와 `README.ko.md` 사이 정보 불일치가 있는지

## 작업 절차

1. 먼저 `README.md`, `README.ko.md`의 현재 섹션 구조와 핵심 내용을 읽는다.
2. 이어서 `package.json`에서 현재 스크립트, 버전, electron-builder 설정, 주요 의존성을 확인한다.
3. `src/main`, `src/preload`, `src/renderer/app`, `src/update-helper`, `scripts/*`를 읽고 README에 적을 수 있는 사실만 추린다. 단순 존재 확인이 아니라 실제 명령어, API 이름, IPC 채널, 구조 정보를 근거로 정리한다.
4. IPC 설명이 있다면 `src/preload/index.ts`와 `src/preload/index.d.ts`의 노출 API를 기준으로 검증하고, 필요하면 `src/main/ipc-handlers/ipc.ts` 등록도 같이 확인한다.
5. 빌드/릴리즈/업데이트 설명은 `package.json` 스크립트와 `scripts/build-tools`, `scripts/release-tools`, `src/main/updates`, `src/update-helper` 기준으로 다시 검증한다.
6. 프로젝트 구조 섹션은 현재 실제 디렉터리와 기능 경계를 기준으로 갱신한다.
7. README 두 파일의 정보 범위와 섹션 구성을 맞추되, 각 언어 문장은 자연스럽게 다듬는다. 한쪽만 수정이 필요한 경우에는 이유를 최종 보고에 남긴다.
8. 코드 기준으로 확인되지 않은 내용은 넣지 않고, 필요한 경우 마지막 보고의 확인 필요 사항에 남긴다.

## README 수정 규칙

- 현재 문서 흐름은 가능한 한 존중하되, 정보 전달이 더 명확해지면 섹션 순서를 재정렬할 수 있다.
- README는 문서형으로 유지하고 광고문처럼 쓰지 않는다.
- 핵심은 "이 프로젝트가 실제로 무엇을 하고, 어떻게 실행/빌드/배포되고, 어떤 구조로 되어 있는지"가 바로 보이게 만드는 것이다.
- 기능 목록은 사용자 관점으로 쓰되, 실제 구현으로 확인된 범위만 적는다.
- 플랫폼 지원 범위는 포장하지 말고 현재 유지 중인 범위 그대로 쓴다.
- 설정, 로컬라이제이션, 업데이트, IPC 설명은 실제 코드와 어긋나면 README 기존 표현보다 코드를 우선한다.
- 두 README의 배지, 버전, 섹션 제목, 코드 블록 예시, 명령어 목록도 함께 맞춘다.
- 링크, 스크린샷, 예시 트리, 설치/실행 예시도 현재 저장소 상태와 맞지 않으면 함께 갱신하거나 제거한다.

## 출력 규칙

- 최종 보고는 반드시 하나의 코드블록으로만 작성한다.
- 코드블록 밖에는 불필요한 설명을 붙이지 않는다.
- 아래 형식을 그대로 사용한다.
- 항목이 없으면 `없음`으로 적는다.

```text
[done]

1. 수정한 파일
- ...
- ...

2. 반영한 내용
- ...
- ...

3. 코드 기준 확인 포인트
- ...
- ...

4. 추가 확인 필요 사항
- 없음
```
