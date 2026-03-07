const DEFAULT_STEP_TEXT = '잠시만 기다려 주세요'
const DEFAULT_PROGRESS = 12

type SplashStepMeta = {
  text: string
  detail: string
  progress: number
}

const SPLASH_STEP_META: Record<string, SplashStepMeta> = {
  'setting-up': {
    text: '환경을 준비하고 있어요',
    detail: '앱 실행에 필요한 환경을 정리하고 있어요',
    progress: 18
  },
  'checking-binaries': {
    text: '필수 파일을 확인하고 있어요',
    detail: 'yt-dlp와 ffmpeg 같은 필수 구성요소를 확인하고 있어요',
    progress: 40
  },
  'downloading-binaries': {
    text: '필수 파일을 내려받고 있어요',
    detail: '필요한 파일이 없으면 자동으로 다운로드해요',
    progress: 68
  },
  finalizing: {
    text: '마무리 작업 중이에요',
    detail: '바로 사용할 수 있도록 마지막 준비를 하고 있어요',
    progress: 86
  },
  'starting-services': {
    text: '서비스를 시작하고 있어요',
    detail: '내부 서비스를 시작하고 첫 화면으로 이동할 준비 중이에요',
    progress: 96
  }
}

function getStepMeta(step?: string): SplashStepMeta | undefined {
  if (!step) return undefined
  return SPLASH_STEP_META[step]
}

export function mapStepToText(step?: string): string {
  return getStepMeta(step)?.text ?? DEFAULT_STEP_TEXT
}

export function mapStepToDetail(step?: string): string {
  return getStepMeta(step)?.detail ?? DEFAULT_STEP_TEXT
}

export function mapStepToProgress(step?: string): number {
  return getStepMeta(step)?.progress ?? DEFAULT_PROGRESS
}
