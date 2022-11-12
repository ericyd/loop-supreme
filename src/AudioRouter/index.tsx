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
import React, { createContext, useContext, useState } from 'react'

const mimeType = 'audio/ogg; codecs=opus'

type AudioAdapter = {
  suspend(): Promise<void>
  resume(): Promise<void>
  playTone(startOfMeasure: boolean): void
  recordStart(): void
  recordStop(): Promise<void>
  audioContext: AudioContext
}

const AudioRouter = createContext<AudioAdapter | null>(null)

type Props = {
  stream: MediaStream
  audioContext: AudioContext
  children: React.ReactNode
}

export const AudioProvider: React.FC<Props> = (props) => {
  const audioContext = props.audioContext
  const stream = props.stream
  const recorder = new MediaRecorder(stream, {
    mimeType,
    audioBitsPerSecond: 192_000 * 24, // 192kHz sample rate * 24-bit depth
  })
  const [audioData, setAudioData] = useState<Blob[]>([])

  // not sure if this should happen on mount, or in `recordStart` method
  const source = audioContext.createMediaStreamSource(stream)
  // this provides monitoring of the input.
  // If monitoring is disabled, simply skip this `connect()` call
  source.connect(audioContext.destination)
  // This is the only documented method I can find for capturing recorded data
  recorder.addEventListener('dataavailable', (event) => {
    setAudioData((data) => [...data, event.data])
  })

  async function suspend() {
    await audioContext.suspend()
  }

  async function resume() {
    await audioContext.resume()
  }

  function playTone(startOfMeasure: boolean) {
    if (audioContext.state !== 'running') {
      console.error(
        `Attempted to play a tone when audio context is not running. Current state: ${audioContext?.state}`
      )
      return
    }
    const time = audioContext.currentTime
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

  function recordStart() {
    recorder.start(1000)
  }

  // TODO: create the Blob immediatly when recording stops
  // https://www.twilio.com/blog/mediastream-recording-api
  async function recordStop() {
    recorder.requestData()
    recorder.stop()

    // convert the raw audio chunks into an AudioBufferSourceNode:
    // Blob[] -> Blob -> ArrayBuffer -> AudioBuffer -> AudioBufferSourceNode
    const blob = new Blob(audioData, { type: mimeType })
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = await audioContext!.decodeAudioData(arrayBuffer)
    const bufferSource = new AudioBufferSourceNode(audioContext, {
      buffer,
      loop: true,
    })

    // Volume control for track playback
    const gain = new GainNode(audioContext, {
      // must be in range [0.0, 1.0]
      gain: 0.99,
    })
    gain.connect(audioContext.destination)
    bufferSource.connect(gain)
    bufferSource.start()
  }

  const adapter = {
    playTone,
    suspend,
    resume,
    recordStart,
    recordStop,
    audioContext,
  }

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
