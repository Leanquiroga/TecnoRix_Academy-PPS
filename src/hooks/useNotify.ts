import { useContext } from 'react'
import { NotifyContext } from '../components/common/notify-context'

export function useNotify() {
  const ctx = useContext(NotifyContext)
  if (!ctx) {
    throw new Error('useNotify debe usarse dentro de NotificationProvider')
  }
  return ctx.notify
}
