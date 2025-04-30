# downtube

유튜브 영상을 다운로드 할 수 있는 프로그램 입니다.

다운로되는 영상은 최고화질으로 다운로드 하도록 구현되어 있습니다.

## 종속성 (필수 설치)

1. python3

```bash
for window
https://www.python.org/downloads/windows/

for mac os
brew install python
```

2. nodejs 18+

```bash
for window
https://nodejs.org

for mac os

brew install node
```

## 적용 기술 및 라이브러리
electron, nodejs, typescript, yt-dlp, ffmpeg


## 추천 IDE 셋업

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 프로젝트 셋업

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build
``
빌드는 반드시 스크립트를 써서 빌드 해야함
윈도우는 64bit 버전만 지원함
맥은 x86, arm64 둘다 각각 빌드됨
``

```bash
# For windows
$ ./build-win.sh

# For macOS
$ ./build-mac.sh
```
