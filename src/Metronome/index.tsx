/**
 * Metronome provides controls for the common metronome settings:
 * BPM, measures per loop, and time signature.
 * It also controls whether or not the click track makes noise,
 * and the global "playing" state of the app.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { generateClickTrack } from './audio-buffer'
import { PlayPause } from '../icons/PlayPause'
import { useKeybindings } from '../hooks/use-keybindings'
import { Scene } from '../Scene'
import { logger } from '../util/logger'

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
  // When in doubt... use dimensional analysis! 🙃 (not clear why the unicode rendering is so different in editor vs online)
  //
  //  60 seconds    beats       60 seconds    minute
  // ———————————— ➗ —————   🟰  ——————————— 𝒙  ———————      =>
  //   minute      minute        minute       beats
  //
  //   seconds    minutes   measures    beats        seconds
  //  ————————— 𝒙 ———————— 𝒙 ———————— 𝒙 ————————  🟰 ——————————
  //   minute     beat      loop       measure        loop
  const loopLengthSeconds =
    (60 / bpm) * measuresPerLoop * timeSignature.beatsPerMeasure

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
   * generate click track buffer for duration of loop
   */
  const clickTrackBuffer = useMemo<AudioBuffer>(() => {
    // this is a little janky, but the idea is that whenever we generate a new click track buffer,
    // the old AudioBufferSourceNode might still be playing. We want to stop it if it is.
    try {
      source.current?.stop()
    } catch (e) {
      logger.error('tried to stop click track node but failed', e)
    }
    try {
      source.current?.disconnect()
    } catch (e) {
      logger.error('tried to disconnect click track node but failed', e)
    }
    return generateClickTrack({
      loopLengthSeconds,
      sampleRate: audioContext.sampleRate,
      bpm,
      measuresPerLoop,
      beatsPerMeasure: timeSignature.beatsPerMeasure,
    })
  }, [
    bpm,
    loopLengthSeconds,
    audioContext.sampleRate,
    timeSignature.beatsPerMeasure,
    measuresPerLoop,
  ])

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
      // DAMN! This doesn't work with pausing and restarting the metronome... DAMNNNNNNN!!!!
      if (
        event.data.message === 'TICK' &&
        gainNode.current &&
        event.data.loopStart
      ) {
        logger.debug(event.data)

        // play click track buffer on loop start
        source.current = new AudioBufferSourceNode(audioContext, {
          buffer: clickTrackBuffer,
        })
        source.current.connect(gainNode.current)
        source.current.start()
      }
    }

    clock.addEventListener('message', clockMessageHandler)
    return () => {
      clock.removeEventListener('message', clockMessageHandler)
    }
  }, [audioContext, clock, clickTrackBuffer])

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
        loopLengthSeconds,
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
    loopLengthSeconds,
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
      loopLengthSeconds,
    } as ClockWorkerUpdateMessage)
  }, [
    bpm,
    timeSignature.beatsPerMeasure,
    measuresPerLoop,
    clock,
    loopLengthSeconds,
  ])

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
      <Scene clock={clock} loopLengthSeconds={loopLengthSeconds} />
    </>
  )
}
