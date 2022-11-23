import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAudioContext } from '../AudioProvider'
import { ControlPanel } from '../ControlPanel'
import { Scene } from '../Scene'
import type { ClockControllerMessage } from '../worklets/clock'
import { decayingSine } from './waveforms'

export type TimeSignature = {
  beatsPerMeasure: number
  // 4 = quarter note
  // 8 = eighth note
  // etc
  beatUnit: number
}

export type MetronomeReader = {
  bpm: number
  currentTick: number
  timeSignature: TimeSignature
  measuresPerLoop: number
  currentMeasure: number
  playing: boolean
  clock: Worker
  gain: number
  muted: boolean
}

export type MetronomeWriter = {
  setBpm: (bpm: number) => void
  setTimeSignature: (timeSignature: TimeSignature) => void
  setMeasuresPerLoop: (count: number) => void
  togglePlaying: () => Promise<void>
  setGain: (gain: number) => void
  setMuted: React.Dispatch<React.SetStateAction<boolean>>
}

type Props = {
  children?: React.ReactNode
}

export const Metronome: React.FC<Props> = () => {
  const { audioContext } = useAudioContext()
  const [currentTick, setCurrentTick] = useState(-1)
  const [bpm, setBpm] = useState(120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    beatsPerMeasure: 4,
    beatUnit: 4,
  })
  const [measuresPerLoop, setMeasuresPerLoop] = useState(2)
  const [playing, setPlaying] = useState(false)
  const [gain, setGain] = useState(0.5)
  const [muted, setMuted] = useState(false)

  /**
   * create 2 AudioBuffers with different frequencies,
   * to be used for the metronome beep.
   */
  const sine330 = useMemo(() => {
    const buffer = audioContext.createBuffer(
      1,
      // this should be the maximum length needed for the audio;
      // since this buffer is just holding a short sine wave, 1 second will be plenty
      audioContext.sampleRate,
      audioContext.sampleRate
    )
    buffer.copyToChannel(decayingSine(buffer.sampleRate, 330), 0)
    return buffer
  }, [audioContext])
  const sine380 = useMemo(() => {
    const buffer = audioContext.createBuffer(
      1,
      audioContext.sampleRate,
      audioContext.sampleRate
    )
    buffer.copyToChannel(decayingSine(buffer.sampleRate, 380), 0)
    return buffer
  }, [audioContext])

  /**
   * Instantiate the clock worker.
   * This is truly the heartbeat of the entire app 🥹
   * Workers should be loaded exactly once for a Component.
   * The `import.meta.url` is thanks to this SO answer https://stackoverflow.com/a/71134400/3991555,
   * which is just a digestible version of the webpack docs https://webpack.js.org/guides/web-workers/
   * I tried refactoring this into a custom hook but ran into all sorts of weird issues. This is easy enough so leaving as is
   */
  const clock = useMemo(
    () => new Worker(new URL('../worklets/clock', import.meta.url)),
    []
  )

  /**
   * Set up metronome gain node.
   * See Track/index.tsx for description of the useRef/useEffect pattern
   */
  const gainNode = useRef(
    new GainNode(audioContext, { gain: muted ? 0.0 : gain })
  )
  useEffect(() => {
    gainNode.current.gain.value = muted ? 0.0 : gain
  }, [gain, muted])

  /**
   * On each tick, set the "currentTick" value and emit a beep.
   * The AudioBufferSourceNode must be created fresh each time,
   * because it can only be played once.
   */
  const clockMessageHandler = useCallback(
    (event: MessageEvent<ClockControllerMessage>) => {
      // console.log(event.data) // this is really noisy
      if (event.data.message === 'TICK') {
        const { currentTick } = event.data
        setCurrentTick(currentTick)

        const source = new AudioBufferSourceNode(audioContext, {
          buffer: event.data.downbeat ? sine380 : sine330,
        })

        gainNode.current.connect(audioContext.destination)
        source.connect(gainNode.current)
        source.start()
      }
    },
    [audioContext, sine330, sine380]
  )

  useEffect(() => {
    clock.addEventListener('message', clockMessageHandler)
    return () => {
      clock.removeEventListener('message', clockMessageHandler)
    }
  }, [clockMessageHandler, clock])

  async function togglePlaying() {
    if (playing) {
      await audioContext.suspend()
      clock.postMessage({
        message: 'STOP',
      })
      setPlaying(false)
    } else {
      await audioContext.resume()
      clock.postMessage({
        bpm,
        beatsPerMeasure: timeSignature.beatsPerMeasure,
        measuresPerLoop,
        message: 'START',
      })
      setPlaying(true)
    }
  }

  useEffect(() => {
    clock.postMessage({
      bpm,
      beatsPerMeasure: timeSignature.beatsPerMeasure,
      measuresPerLoop,
      message: 'UPDATE',
    })
  }, [bpm, timeSignature.beatsPerMeasure, measuresPerLoop, clock])

  const reader: MetronomeReader = {
    bpm,
    // we start at -1 to make the first beat work easily,
    // but we don't want to *show* -1 to the user
    currentTick: Math.max(currentTick % timeSignature.beatsPerMeasure, 0),
    timeSignature,
    measuresPerLoop,
    currentMeasure: Math.max(
      Math.floor(currentTick / timeSignature.beatsPerMeasure),
      0
    ),
    playing,
    clock,
    gain,
    muted,
  }
  const writer: MetronomeWriter = {
    setBpm,
    setTimeSignature,
    setMeasuresPerLoop,
    togglePlaying,
    setGain,
    setMuted,
  }
  return (
    <>
      <ControlPanel metronome={reader} metronomeWriter={writer} />
      <Scene metronome={reader} />
    </>
  )
}
