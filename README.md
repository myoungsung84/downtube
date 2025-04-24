# downtube

An Electron application with React and TypeScript

## 필수
``
nodejs 18+
``

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
