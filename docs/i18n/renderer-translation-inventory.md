# Renderer Translation Inventory

## 조사 범위

- `src/renderer/app/features/**`
- `src/renderer/app/shared/components/**`
- `src/renderer/app/shared/providers/**`
- `src/renderer/app/pages/**`
- `src/renderer/app/app.tsx`
- `src/renderer/app/router.tsx`
- `src/renderer/app/themed-app.tsx`

## 이번 1차 원칙

- 실제 사용자 노출 문자열만 수집했다.
- 공용 여부는 문자열 동일성보다 문맥 동일성을 기준으로 판단했다.
- `common`은 최소화하고 화면/도메인 namespace를 우선했다.
- 실제 치환, i18next 연결, settings 저장 연동, 시스템 언어 감지는 이번 단계에서 제외했다.

## Namespace 설계

- `common`
  - 여러 화면에서 같은 의미로 재사용 가능한 짧은 액션/미디어 타입만 배치
- `navigation`
  - 상단 내비게이션과 화면 이동 문구
- `downloads`
  - 다운로드 화면, 빈 상태, URL 입력, 큐, 잡 상태/오류/토스트
- `library`
  - 라이브러리 화면, 삭제 확인 다이얼로그, 메뉴, 토스트
- `player`
  - 플레이어 컨트롤, 빈 상태, 상단 오버레이, 접근성 라벨
- `settings`
  - 설정 화면 전용 문구
- `splash`
  - 스플래시 단계, 진행 상태, 오류 재시도

## Common 분리 기준

- `common`에 넣은 것
  - `확인`, `취소`, `닫기`
  - `비디오`, `오디오`
- `common`에 넣지 않은 것
  - `삭제`: 라이브러리 삭제 확인/메뉴 액션 문맥이 강해서 `library`
  - `폴더 열기`: 다운로드 폴더, 파일 위치, 플레이어 폴더가 서로 달라서 각 namespace 유지
  - `다시 시도`: 스플래시 초기화 재시도와 다운로드 재시도 의미가 달라 분리
  - `완료`, `실패`: 다운로드 잡 상태/큐 카운트/토스트가 달라 `downloads` 유지

## 문자열 인벤토리

### common

| 파일                                                             | 문맥           | 문자열 | 분류      | namespace | key 제안          |
| ---------------------------------------------------------------- | -------------- | ------ | --------- | --------- | ----------------- |
| `src/renderer/app/shared/providers/dialog/dialog-provider.tsx`   | 기본 확인 액션 | 확인   | 공용 후보 | `common`  | `actions.confirm` |
| `src/renderer/app/shared/providers/dialog/dialog-provider.tsx`   | 기본 취소 액션 | 취소   | 공용 후보 | `common`  | `actions.cancel`  |
| `src/renderer/app/shared/providers/dialog/dialog-provider.tsx`   | 기본 닫기 액션 | 닫기   | 공용 후보 | `common`  | `actions.close`   |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 미디어 타입    | 비디오 | 공용 후보 | `common`  | `media.video`     |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 미디어 타입    | 오디오 | 공용 후보 | `common`  | `media.audio`     |

### navigation

| 파일                                                       | 문맥                      | 문자열     | 분류      | namespace    | key 제안         |
| ---------------------------------------------------------- | ------------------------- | ---------- | --------- | ------------ | ---------------- |
| `src/renderer/app/shared/components/ui/navigation-bar.tsx` | 뒤로가기 툴팁             | 뒤로 가기  | 화면 공용 | `navigation` | `actions.back`   |
| `src/renderer/app/shared/components/ui/navigation-bar.tsx` | 라이브러리 버튼 툴팁/aria | 라이브러리 | 화면 공용 | `navigation` | `items.library`  |
| `src/renderer/app/shared/components/ui/navigation-bar.tsx` | 설정 버튼 툴팁            | 설정       | 화면 공용 | `navigation` | `items.settings` |

### downloads

| 파일                                                                       | 문맥                      | 문자열                                                                       | 분류      | namespace   | key 제안                               |
| -------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------- | --------- | ----------- | -------------------------------------- |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 큐 상태                   | 일시정지 처리중...                                                           | 화면 전용 | `downloads` | `queue.status.pausing`                 |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 큐 상태                   | 다운로드 진행중                                                              | 화면 전용 | `downloads` | `queue.status.running`                 |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 큐 상태                   | 일시정지됨                                                                   | 화면 전용 | `downloads` | `queue.status.paused`                  |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 큐 상태                   | 대기중                                                                       | 화면 전용 | `downloads` | `queue.status.queued`                  |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 큐 상태                   | 준비됨                                                                       | 화면 전용 | `downloads` | `queue.status.ready`                   |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | URL 검증 토스트           | 주소를 입력해주세요                                                          | 화면 전용 | `downloads` | `toast.validation.enter_url`           |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | URL 검증 토스트           | 올바른 영상 주소만 추가할 수 있어요                                          | 화면 전용 | `downloads` | `toast.validation.invalid_url`         |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 최근 기록 타입            | 재생목록                                                                     | 화면 전용 | `downloads` | `history.kind.playlist`                |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 최근 기록 타입            | 영상                                                                         | 화면 전용 | `downloads` | `history.kind.video`                   |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 재생목록 추가 성공 토스트 | 플레이리스트 {{count}}개 항목을 추가했어요! 아래 "시작" 버튼을 눌러보세요 🚀 | 화면 전용 | `downloads` | `toast.submit.playlist_added`          |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 단일 추가 성공 토스트     | 다운로드 목록에 추가했어요! 아래 "시작" 버튼을 눌러보세요 🎉                 | 화면 전용 | `downloads` | `toast.submit.single_added`            |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 추가 실패 토스트          | 주소를 추가하지 못했어요. 입력한 주소를 확인해주세요 😢                      | 화면 전용 | `downloads` | `toast.submit.failed`                  |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 형식 변경 토스트          | {{type}}로 변경했어요                                                        | 화면 전용 | `downloads` | `toast.actions.type_changed`           |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 중단 토스트               | 다운로드를 중단했어요                                                        | 화면 전용 | `downloads` | `toast.actions.stopped`                |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 재시도 검증 토스트        | 정확한 주소를 입력해 주세요                                                  | 화면 전용 | `downloads` | `toast.retry.invalid_url`              |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 재시도 시작 토스트        | 다시 시도합니다! 💪                                                          | 화면 전용 | `downloads` | `toast.retry.started`                  |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 재시도 실패 토스트        | 재시도에 실패했어요                                                          | 화면 전용 | `downloads` | `toast.retry.failed`                   |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 삭제 토스트               | 목록에서 삭제했어요                                                          | 화면 전용 | `downloads` | `toast.actions.deleted`                |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 플레이어 실패 토스트      | 재생할 수 없는 항목입니다                                                    | 화면 전용 | `downloads` | `toast.player.unavailable`             |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 큐 시작 토스트            | 다운로드를 시작합니다! 🎬                                                    | 화면 전용 | `downloads` | `toast.queue.started`                  |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 큐 일시정지 토스트        | 다운로드를 일시정지했어요 ⏸️                                                 | 화면 전용 | `downloads` | `toast.queue.paused`                   |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`         | 완료 이벤트 토스트        | ✨ "{{title}}" 다운로드 완료!                                                | 화면 전용 | `downloads` | `toast.job.completed`                  |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 최근 기록 섹션            | 최근 기록                                                                    | 화면 전용 | `downloads` | `form.recent.title`                    |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 최근 기록 액션            | 전체 삭제                                                                    | 화면 전용 | `downloads` | `form.recent.clear_all`                |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 입력 섹션 제목            | 주소 입력                                                                    | 화면 전용 | `downloads` | `form.title`                           |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 입력 placeholder          | 영상 주소 또는 재생목록 주소를 붙여넣으세요                                  | 화면 전용 | `downloads` | `form.placeholder`                     |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 제출 버튼                 | 처리 중…                                                                     | 화면 전용 | `downloads` | `form.actions.processing`              |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 제출 버튼                 | 추가                                                                         | 화면 전용 | `downloads` | `form.actions.add`                     |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 최근 기록 항목 타입       | 재생목록 주소                                                                | 화면 전용 | `downloads` | `form.recent.option.playlist_url`      |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 최근 기록 항목 타입       | 영상 주소                                                                    | 화면 전용 | `downloads` | `form.recent.option.video_url`         |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 로딩 안내                 | 재생목록 정보를 확인하고 있어요… 잠시만 기다려주세요 ⏳                      | 화면 전용 | `downloads` | `form.submitting.playlist`             |
| `src/renderer/app/features/downloads/components/downloads-url-panel.tsx`   | 로딩 안내                 | 주소 정보를 확인하고 있어요… 곧 완료됩니다 🔍                                | 화면 전용 | `downloads` | `form.submitting.single`               |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 패널 제목                 | 다운로드 관리                                                                | 화면 전용 | `downloads` | `queue.title`                          |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 로딩 상태                 | 불러오는 중…                                                                 | 화면 전용 | `downloads` | `queue.loading`                        |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 폴더 열기 액션            | 폴더 열기                                                                    | 화면 전용 | `downloads` | `queue.actions.open_folder`            |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 통계 칩                   | 전체 {{count}}                                                               | 화면 전용 | `downloads` | `queue.stats.total`                    |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 통계 칩                   | 대기 {{count}}                                                               | 화면 전용 | `downloads` | `queue.stats.queued`                   |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 통계 칩                   | 진행중 {{count}}                                                             | 화면 전용 | `downloads` | `queue.stats.running`                  |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 통계 칩                   | 완료 {{count}}                                                               | 화면 전용 | `downloads` | `queue.stats.completed`                |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 통계 칩                   | 실패 {{count}}                                                               | 화면 전용 | `downloads` | `queue.stats.failed`                   |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 시작 버튼 툴팁            | 먼저 영상 주소를 추가해주세요                                                | 화면 전용 | `downloads` | `queue.tooltips.require_url`           |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 계속하기 툴팁             | 일시정지된 다운로드를 계속합니다                                             | 화면 전용 | `downloads` | `queue.tooltips.resume`                |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 시작 툴팁                 | 대기중인 다운로드를 시작합니다                                               | 화면 전용 | `downloads` | `queue.tooltips.start`                 |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 시작 버튼                 | 계속하기                                                                     | 화면 전용 | `downloads` | `queue.actions.resume`                 |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 시작 버튼                 | 다운로드 시작                                                                | 화면 전용 | `downloads` | `queue.actions.start`                  |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 일시정지 툴팁             | 진행중인 다운로드를 일시정지합니다                                           | 화면 전용 | `downloads` | `queue.tooltips.pause`                 |
| `src/renderer/app/features/downloads/components/downloads-queue-panel.tsx` | 일시정지 버튼             | 일시정지                                                                     | 화면 전용 | `downloads` | `queue.actions.pause`                  |
| `src/renderer/app/features/downloads/components/downloads-job-row.tsx`     | 형식 토글 툴팁            | 형식 변경                                                                    | 화면 전용 | `downloads` | `job.tooltips.change_type`             |
| `src/renderer/app/features/downloads/components/downloads-job-row.tsx`     | 형식 토글 비활성          | 변경 불가                                                                    | 화면 전용 | `downloads` | `job.tooltips.change_type_disabled`    |
| `src/renderer/app/features/downloads/components/downloads-job-row.tsx`     | 액션 툴팁                 | 재생                                                                         | 화면 전용 | `downloads` | `job.tooltips.play`                    |
| `src/renderer/app/features/downloads/components/downloads-job-row.tsx`     | 액션 툴팁                 | 다시 시도                                                                    | 화면 전용 | `downloads` | `job.tooltips.retry`                   |
| `src/renderer/app/features/downloads/components/downloads-job-row.tsx`     | 액션 툴팁                 | 중단                                                                         | 화면 전용 | `downloads` | `job.tooltips.stop`                    |
| `src/renderer/app/features/downloads/components/downloads-job-row.tsx`     | 액션 툴팁                 | 삭제                                                                         | 화면 전용 | `downloads` | `job.tooltips.delete`                  |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 단계 제목                 | 주소 붙여넣기                                                                | 화면 전용 | `downloads` | `empty.steps.paste_url.title`          |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 단계 설명                 | 영상 주소를 위 입력창에 붙여넣으세요                                         | 화면 전용 | `downloads` | `empty.steps.paste_url.description`    |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 단계 제목                 | 목록에 추가                                                                  | 화면 전용 | `downloads` | `empty.steps.add_to_list.title`        |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 단계 설명                 | 여러 영상을 원하는 만큼 추가하세요                                           | 화면 전용 | `downloads` | `empty.steps.add_to_list.description`  |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 단계 제목                 | 한 번에 다운로드                                                             | 화면 전용 | `downloads` | `empty.steps.download_all.title`       |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 단계 설명                 | 다운로드 시작 버튼으로 일괄 처리해요                                         | 화면 전용 | `downloads` | `empty.steps.download_all.description` |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 빈 상태 제목              | 다운로드할 영상을 추가해보세요! 🎬                                           | 화면 전용 | `downloads` | `empty.title`                          |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 빈 상태 설명              | 위 입력창에 영상 주소를 붙여넣으면 자동으로 목록에 추가됩니다.               | 화면 전용 | `downloads` | `empty.description.primary`            |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx` | 빈 상태 설명              | 여러 개를 추가한 후 다운로드 시작 버튼을 눌러 한번에 다운로드하세요!         | 화면 전용 | `downloads` | `empty.description.secondary`          |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 잡 상태 라벨              | 대기중                                                                       | 화면 전용 | `downloads` | `job.status.queued`                    |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 잡 상태 라벨              | 다운로드중                                                                   | 화면 전용 | `downloads` | `job.status.running`                   |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 잡 상태 라벨              | 완료                                                                         | 화면 전용 | `downloads` | `job.status.completed`                 |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 잡 상태 라벨              | 실패                                                                         | 화면 전용 | `downloads` | `job.status.failed`                    |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 잡 상태 라벨              | 취소됨                                                                       | 화면 전용 | `downloads` | `job.status.cancelled`                 |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 제목                 | 알 수 없는 오류                                                              | 화면 전용 | `downloads` | `errors.unknown.title`                 |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 설명                 | 다시 시도해주세요.                                                           | 화면 전용 | `downloads` | `errors.unknown.description`           |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 제목                 | 인터넷 연결 문제                                                             | 화면 전용 | `downloads` | `errors.network.title`                 |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 설명                 | 인터넷 연결을 확인하고 다시 시도해주세요.                                    | 화면 전용 | `downloads` | `errors.network.description`           |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 제목                 | 영상을 찾을 수 없음                                                          | 화면 전용 | `downloads` | `errors.not_found.title`               |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 설명                 | 삭제되었거나 비공개 영상일 수 있어요.                                        | 화면 전용 | `downloads` | `errors.not_found.description`         |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 제목                 | 접근할 수 없는 영상                                                          | 화면 전용 | `downloads` | `errors.unavailable.title`             |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 설명                 | 비공개 또는 지역 제한 영상이에요.                                            | 화면 전용 | `downloads` | `errors.unavailable.description`       |
| `src/renderer/app/features/downloads/lib/downloads-utils.ts`               | 오류 제목                 | 다운로드 실패                                                                | 화면 전용 | `downloads` | `errors.download_failed.title`         |

### library

| 파일                                                           | 문맥                      | 문자열                                            | 분류      | namespace | key 제안                             |
| -------------------------------------------------------------- | ------------------------- | ------------------------------------------------- | --------- | --------- | ------------------------------------ |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 탭 라벨                   | 비디오                                            | 화면 전용 | `library` | `tabs.video`                         |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 탭 라벨                   | 오디오                                            | 화면 전용 | `library` | `tabs.audio`                         |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 로드 실패 토스트          | 라이브러리를 불러오지 못했습니다.                 | 화면 전용 | `library` | `toast.load_failed`                  |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 다운로드 폴더 실패 토스트 | 다운로드 폴더를 열지 못했습니다.                  | 화면 전용 | `library` | `toast.open_downloads_folder_failed` |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 파일 위치 실패 토스트     | 파일 위치를 열지 못했습니다.                      | 화면 전용 | `library` | `toast.open_file_location_failed`    |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 삭제 다이얼로그 제목      | 삭제 확인                                         | 화면 전용 | `library` | `dialog.delete.title`                |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 삭제 다이얼로그 본문      | '{{itemTitle}}' 항목을 라이브러리에서 삭제할까요? | 화면 전용 | `library` | `dialog.delete.message`              |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 삭제 다이얼로그 버튼      | 삭제                                              | 화면 전용 | `library` | `dialog.delete.confirm`              |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 삭제 실패 토스트          | 삭제하지 못했습니다.                              | 화면 전용 | `library` | `toast.delete_failed`                |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 삭제 성공 토스트          | 삭제했습니다.                                     | 화면 전용 | `library` | `toast.deleted`                      |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 플레이어 실패 토스트      | 플레이어를 열지 못했습니다.                       | 화면 전용 | `library` | `toast.open_player_failed`           |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 화면 제목                 | 라이브러리                                        | 화면 전용 | `library` | `header.title`                       |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 화면 설명                 | 완료된 항목만 모아 봅니다.                        | 화면 전용 | `library` | `header.description`                 |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 새로고침 툴팁             | 새로고침                                          | 화면 전용 | `library` | `actions.refresh`                    |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 폴더 열기 버튼            | 폴더 열기                                         | 화면 전용 | `library` | `actions.open_folder`                |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 로딩 텍스트               | 불러오는 중…                                      | 화면 전용 | `library` | `loading`                            |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 빈 상태 제목              | 아직 비디오가 없습니다                            | 화면 전용 | `library` | `empty.video_title`                  |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 빈 상태 제목              | 아직 오디오가 없습니다                            | 화면 전용 | `library` | `empty.audio_title`                  |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 빈 상태 설명              | 다운로드가 완료되면 여기에 표시됩니다.            | 화면 전용 | `library` | `empty.description`                  |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 업로더 fallback           | 업로더 정보 없음                                  | 화면 전용 | `library` | `item.uploader_fallback`             |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 메뉴 액션                 | 파일 위치 열기                                    | 화면 전용 | `library` | `menu.open_file_location`            |
| `src/renderer/app/features/library/screens/library-screen.tsx` | 메뉴 액션                 | 삭제                                              | 화면 전용 | `library` | `menu.delete`                        |

### player

| 파일                                                                              | 문맥               | 문자열                                                    | 분류      | namespace | key 제안                            |
| --------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------- | --------- | --------- | ----------------------------------- |
| `src/renderer/app/features/player/screens/player-screen.tsx`                      | 파일명 fallback    | 알 수 없는 파일                                           | 화면 전용 | `player`  | `fallback.unknown_file`             |
| `src/renderer/app/features/player/components/surfaces/player-empty-state.tsx`     | 빈 상태 제목       | 재생할 파일이 없습니다.                                   | 화면 전용 | `player`  | `empty.title`                       |
| `src/renderer/app/features/player/components/surfaces/player-empty-state.tsx`     | 빈 상태 설명       | player window를 열 때 src를 전달하도록 연결이 필요합니다. | 화면 전용 | `player`  | `empty.description`                 |
| `src/renderer/app/features/player/components/controls/player-bottom-controls.tsx` | 하단 컨트롤 툴팁   | 음소거 (M)                                                | 화면 전용 | `player`  | `controls.bottom.mute`              |
| `src/renderer/app/features/player/components/controls/player-bottom-controls.tsx` | 하단 컨트롤 툴팁   | 음성 시각화                                               | 화면 전용 | `player`  | `controls.bottom.visualizer`        |
| `src/renderer/app/features/player/components/controls/player-bottom-controls.tsx` | 하단 컨트롤 툴팁   | 전체화면 (F)                                              | 화면 전용 | `player`  | `controls.bottom.fullscreen`        |
| `src/renderer/app/features/player/components/controls/player-center-controls.tsx` | 중앙 컨트롤 툴팁   | 10초 뒤로 (←)                                             | 화면 전용 | `player`  | `controls.center.replay_10`         |
| `src/renderer/app/features/player/components/controls/player-center-controls.tsx` | 중앙 컨트롤 툴팁   | 재생/일시정지 (Space)                                     | 화면 전용 | `player`  | `controls.center.toggle_play`       |
| `src/renderer/app/features/player/components/controls/player-center-controls.tsx` | 중앙 컨트롤 툴팁   | 10초 앞으로 (→)                                           | 화면 전용 | `player`  | `controls.center.forward_10`        |
| `src/renderer/app/features/player/components/controls/player-top-overlay.tsx`     | 상단 제목 fallback | 알 수 없는 파일                                           | 화면 전용 | `player`  | `overlay.unknown_file`              |
| `src/renderer/app/features/player/components/controls/player-top-overlay.tsx`     | 폴더 버튼 툴팁     | 폴더 열기                                                 | 화면 전용 | `player`  | `overlay.actions.open_folder_title` |
| `src/renderer/app/features/player/components/controls/player-top-overlay.tsx`     | 폴더 버튼 라벨     | 폴더                                                      | 화면 전용 | `player`  | `overlay.actions.open_folder_label` |
| `src/renderer/app/features/player/components/surfaces/player-audio-panel.tsx`     | 접근성 라벨        | 재생                                                      | 화면 전용 | `player`  | `audio_panel.aria.play`             |
| `src/renderer/app/features/player/components/surfaces/player-audio-panel.tsx`     | 접근성 라벨        | 일시정지                                                  | 화면 전용 | `player`  | `audio_panel.aria.pause`            |

### settings

| 파일                                                             | 문맥      | 문자열                                         | 분류      | namespace  | key 제안                               |
| ---------------------------------------------------------------- | --------- | ---------------------------------------------- | --------- | ---------- | -------------------------------------- |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 헤더 제목 | 설정                                           | 화면 전용 | `settings` | `header.title`                         |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 헤더 설명 | 앱 환경을 맞춤 설정하세요                      | 화면 전용 | `settings` | `header.description`                   |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 섹션 제목 | 화면                                           | 화면 전용 | `settings` | `appearance.section_title`             |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 항목 제목 | 테마                                           | 화면 전용 | `settings` | `appearance.theme.title`               |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 항목 설명 | 시스템 설정 또는 라이트/다크 테마를 선택합니다 | 화면 전용 | `settings` | `appearance.theme.description`         |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 테마 옵션 | 시스템                                         | 화면 전용 | `settings` | `appearance.theme.options.system`      |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 테마 옵션 | 라이트                                         | 화면 전용 | `settings` | `appearance.theme.options.light`       |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 테마 옵션 | 다크                                           | 화면 전용 | `settings` | `appearance.theme.options.dark`        |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 섹션 제목 | 다운로드                                       | 화면 전용 | `settings` | `downloads.section_title`              |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 항목 제목 | 기본 다운로드 형식                             | 화면 전용 | `settings` | `downloads.default_type.title`         |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 항목 설명 | 링크를 추가할 때 기본으로 선택될 형식입니다    | 화면 전용 | `settings` | `downloads.default_type.description`   |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 항목 제목 | 플레이리스트 다운로드 개수                     | 화면 전용 | `settings` | `downloads.playlist_limit.title`       |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | Chip 라벨 | 최대 {{count}}개                               | 화면 전용 | `settings` | `downloads.playlist_limit.badge`       |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 항목 설명 | 플레이리스트에서 한 번에 가져올 영상 수        | 화면 전용 | `settings` | `downloads.playlist_limit.description` |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 옵션      | 10개                                           | 화면 전용 | `settings` | `downloads.playlist_limit.options.10`  |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 옵션      | 20개                                           | 화면 전용 | `settings` | `downloads.playlist_limit.options.20`  |
| `src/renderer/app/features/settings/screens/settings-screen.tsx` | 옵션      | 40개                                           | 화면 전용 | `settings` | `downloads.playlist_limit.options.40`  |

### splash

| 파일                                                             | 문맥           | 문자열                                                  | 분류      | namespace | key 제안                            |
| ---------------------------------------------------------------- | -------------- | ------------------------------------------------------- | --------- | --------- | ----------------------------------- |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 기본 단계 문구 | 잠시만 기다려 주세요                                    | 화면 전용 | `splash`  | `status.waiting`                    |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 준비 단계      | 환경을 준비하고 있어요                                  | 화면 전용 | `splash`  | `steps.preparing.text`              |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 준비 상세      | 앱 실행에 필요한 환경을 정리하고 있어요                 | 화면 전용 | `splash`  | `steps.preparing.detail`            |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 확인 단계      | 필수 파일을 확인하고 있어요                             | 화면 전용 | `splash`  | `steps.checking_binaries.text`      |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 확인 상세      | yt-dlp와 ffmpeg 같은 필수 구성요소를 확인하고 있어요    | 화면 전용 | `splash`  | `steps.checking_binaries.detail`    |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 다운로드 단계  | 필수 파일을 내려받고 있어요                             | 화면 전용 | `splash`  | `steps.downloading_binaries.text`   |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 다운로드 상세  | 필요한 파일이 없으면 자동으로 다운로드해요              | 화면 전용 | `splash`  | `steps.downloading_binaries.detail` |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 마무리 단계    | 마무리 작업 중이에요                                    | 화면 전용 | `splash`  | `steps.finalizing.text`             |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 마무리 상세    | 바로 사용할 수 있도록 마지막 준비를 하고 있어요         | 화면 전용 | `splash`  | `steps.finalizing.detail`           |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 서비스 단계    | 서비스를 시작하고 있어요                                | 화면 전용 | `splash`  | `steps.starting_services.text`      |
| `src/renderer/app/features/splash/lib/splash-step.ts`            | 서비스 상세    | 내부 서비스를 시작하고 첫 화면으로 이동할 준비 중이에요 | 화면 전용 | `splash`  | `steps.starting_services.detail`    |
| `src/renderer/app/features/splash/screens/splash-screen.tsx`     | 상태 fallback  | 잠시만 기다려 주세요                                    | 화면 전용 | `splash`  | `status.waiting`                    |
| `src/renderer/app/features/splash/screens/splash-screen.tsx`     | 로그 문구      | 필수 파일이 없으면 자동 다운로드를 진행해요             | 화면 전용 | `splash`  | `log.auto_download_notice`          |
| `src/renderer/app/features/splash/screens/splash-screen.tsx`     | 로그 문구      | {{stepText}} · 안정적으로 시작하는 중이에요             | 화면 전용 | `splash`  | `log.running`                       |
| `src/renderer/app/features/splash/screens/splash-screen.tsx`     | 로그 문구      | 문제가 해결되면 다시 시도해 주세요                      | 화면 전용 | `splash`  | `log.error_retry`                   |
| `src/renderer/app/features/splash/components/splash-error.tsx`   | 오류 제목      | 초기화 중 문제가 발생했어요                             | 화면 전용 | `splash`  | `error.title`                       |
| `src/renderer/app/features/splash/components/splash-error.tsx`   | 재시도 버튼    | 다시 시도하기                                           | 화면 전용 | `splash`  | `error.actions.retry`               |
| `src/renderer/app/features/splash/components/splash-running.tsx` | 상단 라벨      | initialization                                          | 화면 전용 | `splash`  | `running.label`                     |

## 문구 개선 후보

| 파일                                                                          | 현재 문구                                                                    | 사유                                                                | 다음 단계                                |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| `src/renderer/app/features/player/components/surfaces/player-empty-state.tsx` | player window를 열 때 src를 전달하도록 연결이 필요합니다.                    | 사용자 안내가 아니라 개발 메모에 가깝고 영어/기술 용어가 섞여 있다. | 플레이어 연결 상태 안내 문구로 교체 검토 |
| `src/renderer/app/features/splash/components/splash-running.tsx`              | initialization                                                               | 스플래시 전체는 한국어인데 상단 라벨만 영어라 톤이 분리된다.        | `초기화 중` 같은 문구로 정리 검토        |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`            | 다운로드를 시작합니다! 🎬                                                    | 토스트 톤이 다른 화면보다 다소 캐주얼하고 이모지 의존이 있다.       | i18n 2차에서 톤 정리 검토                |
| `src/renderer/app/features/downloads/screens/downloads-screen.tsx`            | 플레이리스트 {{count}}개 항목을 추가했어요! 아래 "시작" 버튼을 눌러보세요 🚀 | 길고 이모지가 포함되어 번역 길이 증가 시 UI 일관성 관리가 필요하다. | 짧은 성공 문구 + 보조 안내 분리 검토     |
| `src/renderer/app/features/downloads/components/downloads-empty-state.tsx`    | 여러 개를 추가한 후 다운로드 시작 버튼을 눌러 한번에 다운로드하세요!         | `한번에`는 `한 번에`로 다듬는 편이 자연스럽다.                      | 카피 정리 시 수정 검토                   |

## 이번 단계에서 하지 않은 항목

- i18next / react-i18next 설치 및 연결
- locale 로더 구성
- renderer 문자열 실제 치환
- settings 언어 저장값 추가
- 시스템 언어 감지
- preload / IPC 반영
- main process 연동
