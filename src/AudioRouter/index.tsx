/**
 * AudioContext is already a global that is used extensively in this app.
 * Although this is a "React Context", it seemed more important to avoid naming collisions,
 * hence "AudioRouter"
 *
 * Notes
 * 1. AudioContext is not supposed to be initialized/resumed without user action.
 *    In most Web Audio examples, audio context is a mutable global variable that gets set when a user clicks a button.
 *    For a React-based app, using a Ref seemed to be the most appropriate way to approximate that behavior.
 *    However, it led to a lot of awkward nullability checks. Maybe this is OK, but it makes me wonder if there is
 *    a more ergonomic way to expose an audioContext to the rest of the app.
 */
import React, { createContext, useContext, useRef, useState } from 'react'

type AudioAdapter = {
  init(): void
  suspend(): Promise<void>
  resume(): Promise<void>
  playTone(startOfMeasure: boolean): void
}

const AudioRouter = createContext<AudioAdapter | null>(null)

type Props = {
  children: React.ReactNode
}

export const AudioProvider: React.FC<Props> = (props) => {
  const audioContext = useRef<AudioContext>()

  // This just feels strange. But the user has to initiate this. Hm. Not really sure the best way
  function init() {
    if (!audioContext.current) {
      audioContext.current = new AudioContext()
    }
  }

  async function suspend() {
    if (!audioContext.current) {
      console.error('Attempted to suspend before audio context was initialized')
      return
    }
    await audioContext.current.suspend()
  }

  async function resume() {
    if (!audioContext.current) {
      console.error('Attempted to resume before audio context was initialized')
      return
    }
    await audioContext.current.resume()
  }

  function playTone(startOfMeasure: boolean) {
    if (!audioContext.current || audioContext.current.state !== 'running') {
      console.error(
        `Attempted to play a tone when audio context is not running. Current state: ${audioContext.current?.state}`
      )
      return
    }
    const time = audioContext.current.currentTime
    const mainGainNode = new GainNode(audioContext.current, {
      // must be in range [0.0, 1.0]
      gain: 0.15,
    })
    mainGainNode.connect(audioContext.current.destination)
    const frequency = startOfMeasure ? 490 : 440
    // we want (frequency/duration) to always be a whole number,
    // so the sine wave doesn't clip
    const duration = 0.1
    // OscillatorNodes can only be played once! Therefore, they must be instantiated every time we need a "beep".
    // https://stackoverflow.com/a/33723682 suggests an alternative of connecting/disconnecting as needed,
    // but I don't believe that will fit our needs because we want the disconnect to be a very specific timing interval after the start.
    const osc = new OscillatorNode(audioContext.current, {
      frequency,
      // can be "sine", "square", "sawtooth", "triangle", or "custom"
      // when "custom", need to create a custom waveform, then set it like so:
      //    const sineTerms = new Float32Array([0, 0, 1, 0, 1]);
      //    const cosineTerms = new Float32Array(sineTerms.length);
      //    const customWaveform = audioContext.createPeriodicWave(cosineTerms, sineTerms);
      //    osc.setPeriodicWave(customWaveform);
      // this could be nice for customizing the metronome sound (eventually...)
      type: 'sine',
    })

    osc.connect(mainGainNode)
    osc.start(time)
    osc.stop(time + duration)
    return osc
  }

  const adapter = { init, playTone, suspend, resume }

  return (
    <AudioRouter.Provider value={adapter}>
      {props.children}
    </AudioRouter.Provider>
  )
}

export function useAudioRouter() {
  const audioRouter = useContext(AudioRouter)

  if (audioRouter === null) {
    throw new Error('useAudioRouter cannot be used outside of AudioProvider')
  }

  return audioRouter
}
