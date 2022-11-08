/**
 * AudioContext is already a global that is used extensively in this app.
 * Although this is a "React Context", it seemed more important to avoid naming collisions,
 * hence "AudioRouter"
 *
 * Notes
 * 1. This context makes extensive use of `!` to indicate non-nullability of the AudioContext ref.
 *    Currently looking for better options...
 */
import React, { createContext, useContext, useRef, useState } from 'react'

type AudioAdapter = {
  init(): void
  playTone(time: number, startOfMeasure: boolean): void
  audioContext: AudioContext
}

const AudioRouter = createContext<AudioAdapter | null>(null)

type Props = {
  children: React.ReactNode
}

export const AudioProvider: React.FC<Props> = (props) => {
  const [audioContext, setAudioContext] = useState<AudioContext>()

  // This just feels strange. But the user has to initiate this. Hm. Not really sure the best way
  function init() {
    if (!audioContext) {
      setAudioContext(new AudioContext())
    }
  }

  // TODO: should this `init` automatically?
  function playTone(time: number, startOfMeasure: boolean) {
    if (!audioContext || audioContext.state !== 'running') {
      console.log(
        `Attempted to play a tone when audio context is not running. Current state: ${audioContext?.state}`
      )
      return
    }
    const mainGainNode = new GainNode(audioContext, {
      // must be in range [0.0, 1.0]
      gain: 0.15,
    })
    mainGainNode.connect(audioContext.destination)
    const frequency = startOfMeasure ? 490 : 440
    // we want (frequency/duration) to always be a whole number,
    // so the sine wave doesn't clip
    const duration = 0.1
    // OscillatorNodes can only be played once! Therefore, they must be instantiated every time we need a "beep".
    // https://stackoverflow.com/a/33723682 suggests an alternative of connecting/disconnecting as needed,
    // but I don't believe that will fit our needs because we want the disconnect to be a very specific timing interval after the start.
    const osc = new OscillatorNode(audioContext, {
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

  return (
    <AudioRouter.Provider
      value={{ init, playTone, audioContext: audioContext! }}
    >
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
