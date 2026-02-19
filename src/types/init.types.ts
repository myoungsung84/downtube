export type InitState =
  | { status: 'idle' }
  | { status: 'running'; step?: string; progress?: number }
  | { status: 'ready' }
  | { status: 'error'; message: string }
