# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| Latest | yes |
| Older versions | no |

## Reporting a Vulnerability

Please do not report security issues through public GitHub issues.

If GitHub private vulnerability reporting is available for this repository, use it. Otherwise, contact the maintainer through an available GitHub contact channel and include:

- a clear description of the issue
- steps to reproduce it
- the affected version or environment
- the expected impact or security risk

Please share enough detail to reproduce and validate the issue, but avoid posting sensitive information publicly.

## Scope

This policy mainly covers reports related to:

- Electron security configuration
- IPC exposure between renderer and main process
- unsafe external link handling
- dependency vulnerabilities
- packaging or distribution issues

## Disclaimer

This is a personal open source project. Security fixes are handled on a best-effort basis, and response time may vary depending on maintainer availability.

---

# 참고용 한국어 번역

아래 한국어 내용은 이해를 돕기 위한 참고용 번역입니다.
정책 해석의 기준은 상단의 영어 문서입니다.

## Supported Versions

| Version | Supported |
| --- | --- |
| Latest | yes |
| Older versions | no |

최신 릴리즈만 보안 수정 지원 대상으로 봅니다. 이전 버전은 보안 수정이 제공되지 않을 수 있습니다.

## Reporting a Vulnerability

보안 이슈는 공개 GitHub 이슈로 제보하지 마세요.

이 저장소에서 GitHub 비공개 취약점 제보 기능을 사용할 수 있다면 그 경로를 사용해 주세요. 사용할 수 없다면 GitHub에서 제공되는 maintainer 연락 수단을 통해 제보해 주세요. 제보 시 아래 내용을 함께 포함해 주세요.

- 취약점 또는 문제에 대한 명확한 설명
- 재현 방법
- 영향받는 버전 또는 실행 환경
- 예상되는 영향 범위 또는 보안 위험

재현과 검증에 필요한 정보는 충분히 포함해 주시되, 민감한 정보는 공개된 곳에 올리지 마세요.

## Scope

이 정책은 주로 아래 범위의 보안 이슈를 다룹니다.

- Electron 보안 설정
- renderer와 main process 사이의 IPC 노출
- 안전하지 않은 외부 링크 처리
- 의존성 취약점
- 패키징 또는 배포 관련 문제

## Disclaimer

이 프로젝트는 개인 오픈소스 프로젝트입니다. 보안 수정은 best-effort 기준으로 처리되며, maintainer 상황에 따라 대응 시점은 달라질 수 있습니다.
