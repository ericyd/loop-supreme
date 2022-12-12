/**
 * Metronome provides controls for the common metronome settings:
 * BPM, measures per loop, and time signature.
 * It also controls whether or not the click track makes noise,
 * and the global "playing" state of the app.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioContext } from '../AudioProvider'
import { BeatCounter } from './controls/BeatCounter'
import { MeasuresPerLoopControl } from './controls/MeasuresPerLoopControl'
import { TempoControl } from './controls/TempoControl'
import { TimeSignatureControl } from './controls/TimeSignatureControl'
import { VolumeControl } from './controls/VolumeControl'
import type {
  ClockControllerMessage,
  ClockWorkerStartMessage,
  ClockWorkerStopMessage,
  ClockWorkerUpdateMessage,
} from '../workers/clock'
import { useSineAudioBuffer } from '../hooks/use-audio-buffer'
import { PlayPause } from '../icons/PlayPause'
import { useKeybindings } from '../hooks/use-keybindings'
import { Scene } from '../Scene'

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
  const [bpm, setBpm] = useState(120)
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
  const sine330 = useSineAudioBuffer(audioContext, 330)
  const sine380 = useSineAudioBuffer(audioContext, 380)

  /**
   * Set up metronome gain node.
   * See Track/index.tsx for description of the useRef/useEffect pattern
   */
  const gainNode = useRef<GainNode | null>()
  useEffect(() => {
    gainNode.current = new GainNode(audioContext, { gain: 0.5 })
    gainNode.current.connect(audioContext.destination)
    return () => {
      gainNode.current?.disconnect()
    }
  }, [audioContext])
  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = muted ? 0.0 : gain
    }
  }, [gain, muted])

  // I don't think this is an ideal use for a ref,
  // but this is the easiest way to be able to "disconnect" on each loop.
  // This isn't strictly necessary afaik, but I think it will help with garbage cleanup
  const source = useRef<AudioBufferSourceNode | null>(null)

  /**
   * Add clock event listeners.
   * On each tick, set the "currentTick" value and emit a beep.
   * The AudioBufferSourceNode must be created fresh each time,
   * because it can only be played once.
   */
  useEffect(() => {
    const clockMessageHandler = (
      event: MessageEvent<ClockControllerMessage>
    ) => {
      // console.log(event.data) // this is really noisy
      if (event.data.message === 'TICK' && gainNode.current) {
        if (source.current) {
          source.current.disconnect()
        }
        source.current = new AudioBufferSourceNode(audioContext, {
          buffer: event.data.downbeat ? sine380 : sine330,
        })
        source.current.connect(gainNode.current)
        source.current.start()
      }
    }

    clock.addEventListener('message', clockMessageHandler)
    return () => {
      clock.removeEventListener('message', clockMessageHandler)
    }
  }, [audioContext, sine330, sine380, clock])

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

  useKeybindings({
    c: { callback: toggleMuted },
    ' ': { callback: togglePlaying, preventDefault: true },
  })

  return (
    <>
      <div className="flex mb-8 items-end justify-between sticky top-0 bg-white dark:bg-black py-4">
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
              clock={clock}
              beatsPerMeasure={timeSignature.beatsPerMeasure}
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
      <Scene clock={clock} />
    </>
  )
}
