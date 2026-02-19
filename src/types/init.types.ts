export type InitStep =
  | 'setting-up'
  | 'checking-binaries'
  | 'downloading-binaries'
  | 'finalizing'
  | 'starting-services'

/**
 * 0~100 범위의 진행률을 나타냅니다.
 * 실제 런타임에서는 clamp 처리를 통해 범위를 보장해야 합니다.
 */
export type InitProgress = number

export type InitState =
  | { status: 'idle' }
  | { status: 'running'; step?: InitStep; progress?: InitProgress }
  | { status: 'ready' }
  | { status: 'error'; message: string }
