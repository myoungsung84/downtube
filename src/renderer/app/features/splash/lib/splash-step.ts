export type SplashTextKey =
  | 'status.waiting'
  | 'steps.preparing.text'
  | 'steps.checking_binaries.text'
  | 'steps.downloading_binaries.text'
  | 'steps.finalizing.text'
  | 'steps.starting_services.text'

export type SplashDetailKey =
  | 'steps.preparing.detail'
  | 'steps.checking_binaries.detail'
  | 'steps.downloading_binaries.detail'
  | 'steps.finalizing.detail'
  | 'steps.starting_services.detail'

const DEFAULT_STEP_TEXT_KEY: SplashTextKey = 'status.waiting'
const DEFAULT_PROGRESS = 12

type SplashStepMeta = {
  textKey: SplashTextKey
  detailKey: SplashDetailKey
  progress: number
}

const SPLASH_STEP_META: Record<string, SplashStepMeta> = {
  'setting-up': {
    textKey: 'steps.preparing.text',
    detailKey: 'steps.preparing.detail',
    progress: 18
  },
  'checking-binaries': {
    textKey: 'steps.checking_binaries.text',
    detailKey: 'steps.checking_binaries.detail',
    progress: 40
  },
  'downloading-binaries': {
    textKey: 'steps.downloading_binaries.text',
    detailKey: 'steps.downloading_binaries.detail',
    progress: 68
  },
  finalizing: {
    textKey: 'steps.finalizing.text',
    detailKey: 'steps.finalizing.detail',
    progress: 86
  },
  'starting-services': {
    textKey: 'steps.starting_services.text',
    detailKey: 'steps.starting_services.detail',
    progress: 96
  }
}

function getStepMeta(step?: string): SplashStepMeta | undefined {
  if (!step) return undefined
  return SPLASH_STEP_META[step]
}

export function mapStepToTextKey(step?: string): SplashTextKey {
  return getStepMeta(step)?.textKey ?? DEFAULT_STEP_TEXT_KEY
}

export function mapStepToDetailKey(step?: string): SplashDetailKey | undefined {
  return getStepMeta(step)?.detailKey
}

export function mapStepToProgress(step?: string): number {
  return getStepMeta(step)?.progress ?? DEFAULT_PROGRESS
}
