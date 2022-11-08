import React, { createContext, useContext, useRef, useState } from 'react'
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
  playing: boolean
  events: EventTarget
}

type MetronomeWriter = {
  setBpm: (bpm: number) => void
  setTimeSignature: (timeSignature: TimeSignature) => void
  setMeasureCount: (count: number) => void
  togglePlaying: () => Promise<void>
}

type MetronomeAdapter = [MetronomeReader, MetronomeWriter]

const MetronomeContext = createContext<MetronomeAdapter | null>(null)

type Props = {
  children: React.ReactNode
}

export const MetronomeProvider: React.FC<Props> = (props) => {
  const [currentTick, setCurrentTick] = useState(-1)
  const [bpm, setBpm] = useState(120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    beatsPerMeasure: 4,
    beatUnit: 4,
  })
  const [measureCount, setMeasureCount] = useState(1)
  // no autoplay!
  const [playing, setPlaying] = useState(false)
  // An EventTarget with React? Why?
  // Although the metronome settings (currentTick, BPM, etc) are all stored as state,
  // the metronome needs a way to communicate to components that a beat occured.
  // As far as I know, there is no natural way to subscribe to state changes in an event-driven way,
  // but given that we're running in a browser, EventTargets are still a totally natural way
  // to build a pub/sub notification system.
  const events = useRef(new EventTarget())

  // TODO: should this be a ref, so it doesn't autoplay immediately? https://developer.chrome.com/blog/autoplay/#webaudio
  const audioContext = new AudioContext()
  const mainGainNode = new GainNode(audioContext, {
    // must be in range [0.0, 1.0]
    gain: 0.15,
  })
  // TODO: should this happen in useEffect?
  mainGainNode.connect(audioContext.destination)

  function playTone(time: number, startOfMeasure: boolean) {
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

  async function togglePlaying() {
    if (playing) {
      await audioContext.suspend()
      setPlaying(false)
    } else {
      await audioContext.resume()
      setPlaying(true)
    }
  }

  // The Web Audio API documentation has a substantially more involved looking description of how to make this work:
  //    https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques#playing_the_audio_in_time
  // For now, this seems to be working ok and it accomplishes the basic goal
  useInterval(
    () => {
      if (audioContext.state !== 'running') {
        return
      }
      const isFirstBeat =
        (currentTick + 1) % (timeSignature.beatsPerMeasure * measureCount) === 0
      if (isFirstBeat) {
        events.current.dispatchEvent(new Event('downbeat'))
      }
      events.current.dispatchEvent(new Event('beat'))
      playTone(audioContext.currentTime, isFirstBeat)
      // Advance the beat number, wrap to zero when reaching end of measure
      setCurrentTick(
        (value) => (value + 1) % (timeSignature.beatsPerMeasure * measureCount)
      )
    },
    playing ? (60 / bpm) * 1000 : null
  )

  // TODO: this is logging twice, which probably means it's mounting twice and not getting cleared when the first one unmounts
  // it probably is not an issue this early in development but should be handled eventually
  console.log({ currentTick })
  const reader = {
    bpm,
    // we start at -1 to make the first beat work easily,
    // but we don't want to *show* -1 to the user
    currentTick: Math.max(currentTick % timeSignature.beatsPerMeasure, 0),
    timeSignature,
    measureCount,
    currentMeasure: Math.max(
      Math.floor(currentTick / timeSignature.beatsPerMeasure),
      0
    ),
    // TODO: if `audioContext.state` were a piece of React state, we could simply do `playing: audioContext.state === 'running'`
    // However, since audioContext.state is just a mutable variable, updates to it don't get sent downstream.
    playing,
    events: events.current,
  }
  const writer = {
    setBpm,
    setTimeSignature,
    setMeasureCount,
    togglePlaying,
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
