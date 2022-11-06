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
  playing: boolean
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
  const [currentTick, setCurrentTick] = useState(0)
  const [bpm, setBpm] = useState(120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    beatsPerMeasure: 4,
    beatUnit: 4,
  })
  const [measureCount, setMeasureCount] = useState(1)
  // no autoplay!
  const [playing, setPlaying] = useState(false)

  // TODO: should this be a ref, so it doesn't autoplay immediately? https://developer.chrome.com/blog/autoplay/#webaudio
  const audioContext = new AudioContext()
  const mainGainNode = new GainNode(audioContext, {
    // must be in range [0.0, 1.0]
    gain: 0.15,
  })
  // TODO: should this happen in useEffect?
  mainGainNode.connect(audioContext.destination)

  function playTone(time: number, length = 0.15) {
    // OscillatorNodes can only be played once! Therefore, they must be instantiated every time we need a "beep".
    // https://stackoverflow.com/a/33723682 suggests an alternative of connecting/disconnecting as needed,
    // but I don't believe that will fit our needs because we want the disconnect to be a very specific timing interval after the start.
    const osc = new OscillatorNode(audioContext, {
      frequency: 440,
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
    if (audioContext.state === 'running') {
      osc.start(time)
      osc.stop(time + length)
    }
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
      playTone(audioContext.currentTime)
      // Advance the beat number, wrap to zero when reaching end of measure
      setCurrentTick(
        (value) => (value + 1) % (timeSignature.beatsPerMeasure * measureCount)
      )
      return null
    },
    playing ? (60 / bpm) * 1000 : null
  )

  // TODO: this is logging twice, which probably means it's mounting twice and not getting cleared when the first one unmounts
  // it probably is not an issue this early in development but should be handled eventually
  console.log({ currentTick })
  const reader = {
    bpm,
    currentTick: currentTick % timeSignature.beatsPerMeasure,
    timeSignature,
    measureCount,
    currentMeasure: Math.floor(currentTick / timeSignature.beatsPerMeasure),
    playing,
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
