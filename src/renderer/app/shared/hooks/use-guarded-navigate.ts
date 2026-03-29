import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useDialog } from './use-dialog'
import { useI18n } from './use-i18n'
import { useUpdate } from './use-update'

export function useGuardedNavigate(): (to: string) => Promise<void> {
  const location = useLocation()
  const navigate = useNavigate()
  const { confirm } = useDialog()
  const { t } = useI18n('settings')
  const { cancelUpdate, isUpdateInProgress } = useUpdate()

  return useCallback(
    async (to: string): Promise<void> => {
      if (location.pathname === to) {
        return
      }

      if (!isUpdateInProgress) {
        navigate(to)
        return
      }

      const shouldCancelAndMove = await confirm({
        title: t('updates.navigation_guard.title'),
        message: t('updates.navigation_guard.message'),
        confirmText: t('updates.navigation_guard.cancel_and_move'),
        cancelText: t('updates.navigation_guard.keep_updating'),
        variant: 'danger'
      })

      if (!shouldCancelAndMove) {
        return
      }

      try {
        await cancelUpdate()
      } catch {
        // 취소 실패 시에도 항상 이동을 허용한다.
      }

      navigate(to)
    },
    [cancelUpdate, confirm, isUpdateInProgress, location.pathname, navigate, t]
  )
}
