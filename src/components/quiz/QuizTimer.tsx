import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Stack, Typography, LinearProgress } from '@mui/material'

interface Props {
  minutes: number
  onTimeUp: () => void
}

const pad = (n: number) => n.toString().padStart(2, '0')

const QuizTimer: React.FC<Props> = ({ minutes, onTimeUp }) => {
  const totalMs = useMemo(() => Math.max(1, Math.round(minutes * 60 * 1000)), [minutes])
  const [remainingMs, setRemainingMs] = useState(totalMs)
  const endAtRef = useRef<number | null>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    endAtRef.current = Date.now() + totalMs
    setRemainingMs(totalMs)
    firedRef.current = false
  }, [totalMs])

  useEffect(() => {
    const id = setInterval(() => {
      const endAt = endAtRef.current ?? Date.now() + totalMs
      const left = endAt - Date.now()
      if (left <= 0) {
        clearInterval(id)
        setRemainingMs(0)
        if (!firedRef.current) {
          firedRef.current = true
          onTimeUp()
        }
      } else {
        setRemainingMs(left)
      }
    }, 250)
    return () => clearInterval(id)
  }, [onTimeUp, totalMs])

  const secs = Math.floor(remainingMs / 1000)
  const mm = Math.floor(secs / 60)
  const ss = secs % 60
  const progress = (1 - remainingMs / totalMs) * 100

  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography variant="body2">Tiempo restante: {pad(mm)}:{pad(ss)}</Typography>
      <LinearProgress variant="determinate" value={progress} />
    </Stack>
  )
}

export default QuizTimer
