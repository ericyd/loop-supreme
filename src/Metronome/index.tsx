/*

I think what I need to do is
1. create a "Clock" component that is the parent of everything
2. the only thing it really does is create a Clock worker, and pass that to all children
3. one child of Clock is Metronome. Metronome sends events to Clock to start or stop, as well as controlling speed, etc
4. Scene is also a child of Clock. Scene passes Clock to its child Tracks
5. Tracks subscribe to Clock events
6. IMPORTANT: clock events must send additional properties in the events, so that metronome props like bpm, time signature, etc DO NOT need to get passed as props

*/

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioContext } from '../AudioProvider'
import { BeatCounter } from './BeatCounter'
import { MeasuresPerLoopControl } from './controls/MeasuresPerLoopControl'
import { TempoControl } from './controls/TempoControl'
import { TimeSignatureControl } from './controls/TimeSignatureControl'
import { useKeyboard } from '../KeyboardProvider'
import { VolumeControl } from './controls/VolumeControl'
import type {
  ClockControllerMessage,
  ClockWorkerStartMessage,
  ClockWorkerStopMessage,
  ClockWorkerUpdateMessage,
} from '../workers/clock'
import { useDecayingSine } from './waveforms'
import { useDebouncedCallback } from 'use-debounce'
import { PlayPause } from '../icons/PlayPause'

export type TimeSignature = {
  beatsPerMeasure: number
  // 4 = quarter note
  // 8 = eighth note
  // etc
  beatUnit: number
}

type Props = {
  clock: Worker
}

export const Metronome: React.FC<Props> = ({ clock }) => {
  const { audioContext } = useAudioContext()
  const keyboard = useKeyboard()
  const [currentTick, setCurrentTick] = useState(-1)
  const [bpm, setBpmDefault] = useState(120)
  const setBpm = useDebouncedCallback(setBpmDefault, 100, {
    leading: true,
    trailing: false,
  })
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    beatsPerMeasure: 4,
    beatUnit: 4,
  })
  const [measuresPerLoop, setMeasuresPerLoop] = useState(2)
  const [playing, setPlaying] = useState(false)
  const [gain, setGain] = useState(0.5)
  const [muted, setMuted] = useState(false)
  const toggleMuted = useCallback(() => setMuted((muted) => !muted), [])

  /**
   * create 2 AudioBuffers with different frequencies,
   * to be used for the metronome beep.
   */
  const sine330 = useDecayingSine(audioContext, 330)
  const sine380 = useDecayingSine(audioContext, 380)

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

  /**
   * Add clock event listeners
   */
  useEffect(() => {
    clock.addEventListener('message', clockMessageHandler)
    return () => {
      clock.removeEventListener('message', clockMessageHandler)
    }
  }, [clockMessageHandler, clock])

  /**
   * When "playing" is toggled on/off,
   * Send a message to the clock worker to start or stop.
   * In addition, suspend the audio context.
   * Suspending the audio context is _probably_ redundant,
   * since the clock events drive the whole app.
   * But, until proven otherwise, going to leave it.
   */
  const togglePlaying = useCallback(async () => {
    if (playing) {
      await audioContext.suspend()
      clock.postMessage({
        message: 'STOP',
      } as ClockWorkerStopMessage)
      setPlaying(false)
    } else {
      await audioContext.resume()
      clock.postMessage({
        message: 'START',
        bpm,
        beatsPerMeasure: timeSignature.beatsPerMeasure,
        measuresPerLoop,
      } as ClockWorkerStartMessage)
      setPlaying(true)
    }
  }, [
    audioContext,
    playing,
    timeSignature.beatsPerMeasure,
    measuresPerLoop,
    bpm,
    clock,
  ])

  /**
   * Bind any changes to core metronome properties to the clock.
   */
  useEffect(() => {
    clock.postMessage({
      message: 'UPDATE',
      bpm,
      beatsPerMeasure: timeSignature.beatsPerMeasure,
      measuresPerLoop,
    } as ClockWorkerUpdateMessage)
  }, [bpm, timeSignature.beatsPerMeasure, measuresPerLoop, clock])

  /**
   * Bind keyboard effects
   */
  useEffect(() => {
    keyboard.on('c', 'Metronome', toggleMuted)
    // kinda wish I could write "space" but I guess this is the way this works.
    keyboard.on(' ', 'Metronome', (e) => {
      // Only toggle playing if another control element is not currently focused
      if (
        !['INPUT', 'SELECT', 'BUTTON'].includes(
          document.activeElement?.tagName ?? ''
        )
      ) {
        togglePlaying()
        e.preventDefault()
      }
    })
  }, [keyboard, togglePlaying, toggleMuted])

  return (
    <div className="flex mb-12 items-end justify-between">
      <div className="flex items-start content-center mb-2 mr-2">
        <PlayPause onClick={togglePlaying} playing={playing} />

        <VolumeControl
          muted={muted}
          toggleMuted={toggleMuted}
          gain={gain}
          onChange={setGain}
        />
      </div>

      <div className="flex">
        <div className="flex flex-col items-center">
          <BeatCounter
            // we start at -1 to make the first beat work easily,
            // but we don't want to *show* -1 to the user
            currentTick={Math.max(
              currentTick % timeSignature.beatsPerMeasure,
              0
            )}
            currentMeasure={Math.max(
              Math.floor(currentTick / timeSignature.beatsPerMeasure),
              0
            )}
          />

          <TimeSignatureControl
            onChange={setTimeSignature}
            beatsPerMeasure={timeSignature.beatsPerMeasure}
            beatUnit={timeSignature.beatUnit}
          />
        </div>

        <TempoControl onChange={setBpm} defaultValue={bpm} />

        <MeasuresPerLoopControl
          onChange={setMeasuresPerLoop}
          measuresPerLoop={measuresPerLoop}
        />
      </div>
    </div>
  )
}
