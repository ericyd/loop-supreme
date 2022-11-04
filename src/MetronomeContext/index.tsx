import React, { createContext, useContext, useState } from 'react'
import { useInterval } from '../hooks/useInterval'

type TimeSignature = {
  beatsPerMeasure: number
  // 4 = quarter note
  // 8 = eighth note
  // etc
  beatUnit: number
}

type MetronomeReader = {
  bpm: number
  currentTick: number
  timeSignature: TimeSignature
  measureCount: number
  currentMeasure: number
}

type MetronomeWriter = {
  setBpm: (bpm: number) => void
  setTimeSignature: (timeSignature: TimeSignature) => void
  setMeasureCount: (count: number) => void
}

type MetronomeAdapter = [MetronomeReader, MetronomeWriter]

const MetronomeContext = createContext<MetronomeAdapter | null>(null)

type Props = {
  children: React.ReactNode
}

export const MetronomeProvider: React.FC<Props> = (props) => {
  const [currentTick, setCurrentTick] = useState(0)
  const [bpm, setBpm] = useState(120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    beatsPerMeasure: 4,
    beatUnit: 4,
  })
  const [measureCount, setMeasureCount] = useState(1)
  useInterval(() => {
    setCurrentTick(
      (value) => (value + 1) % (timeSignature.beatsPerMeasure * measureCount)
    )
    return null
  }, (60 / bpm) * 1000)
  // TODO: this is logging twice, which probably means it's mounting twice and not getting cleared when the first one unmounts
  // it probably is not an issue this early in development but should be handled eventually
  // console.log({ currentTick })
  const reader = {
    bpm,
    currentTick: currentTick % timeSignature.beatsPerMeasure,
    timeSignature,
    measureCount,
    currentMeasure: Math.floor(currentTick / timeSignature.beatsPerMeasure),
  }
  const writer = {
    setBpm,
    setTimeSignature,
    setMeasureCount,
  }
  return (
    <MetronomeContext.Provider value={[reader, writer]}>
      {props.children}
    </MetronomeContext.Provider>
  )
}

export function useMetronome() {
  const metronomeContext = useContext(MetronomeContext)

  if (metronomeContext === null) {
    throw new Error('useMetronome cannot be used outside of MetronomeProvider')
  }

  return metronomeContext
}
