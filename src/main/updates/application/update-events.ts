import type { AppUpdateEvent } from '../../../types/update.types'

type AppUpdateEventListener = (event: AppUpdateEvent) => void

const updateEventListeners = new Set<AppUpdateEventListener>()

export function emitAppUpdateEvent(event: AppUpdateEvent): void {
  for (const listener of updateEventListeners) {
    listener(event)
  }
}

export function onAppUpdateEvent(listener: AppUpdateEventListener): () => void {
  updateEventListeners.add(listener)
  return () => {
    updateEventListeners.delete(listener)
  }
}
