import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Alert, AlertTitle, Snackbar } from '@mui/material'
import { NotifyContext } from './notify-context'
import type { NotifyContextValue, NotifyOptions } from './notify-context'

type QueueItem = NotifyOptions

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<QueueItem | null>(null)
  const queueRef = useRef<QueueItem[]>([])

  // Cola simple: mostramos una a la vez y avanzamos al cerrar

  const notify: NotifyContextValue['notify'] = useCallback((options) => {
    const item: QueueItem =
      typeof options === 'string' ? { message: options, severity: 'info' } : options
    queueRef.current.push({ autoHideDuration: 4000, severity: 'info', ...item })
    // kick the queue
    if (!open && !current) {
      const next = queueRef.current.shift() || null
      if (next) {
        setCurrent(next)
        setOpen(true)
      }
    }
  }, [open, current])

  const handleClose = useCallback((_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }, [])

  const handleExited = useCallback(() => {
    setCurrent(null)
    // process next
    const next = queueRef.current.shift() || null
    if (next) {
      setCurrent(next)
      setOpen(true)
    }
  }, [])

  const value = useMemo<NotifyContextValue>(() => ({ notify }), [notify])

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        onClose={handleClose}
        autoHideDuration={current?.autoHideDuration}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionProps={{ onExited: handleExited }}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity={current?.severity ?? 'info'}
          sx={{ minWidth: 280 }}
        >
          {current?.title && <AlertTitle>{current.title}</AlertTitle>}
          {current?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  )
}

