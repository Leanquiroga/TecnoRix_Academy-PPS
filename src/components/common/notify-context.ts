import { createContext } from 'react'

export type NotifySeverity = 'success' | 'info' | 'warning' | 'error'

export interface NotifyOptions {
  message: string
  severity?: NotifySeverity
  autoHideDuration?: number
  title?: string
}

export interface NotifyContextValue {
  notify: (options: NotifyOptions | string) => void
}

export const NotifyContext = createContext<NotifyContextValue | undefined>(undefined)
