import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAudioRouter } from '../AudioRouter'

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
  const audioRouter = useAudioRouter()
  const [currentTick, setCurrentTick] = useState(-1)
  const [bpm, setBpm] = useState(120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    beatsPerMeasure: 4,
    beatUnit: 4,
  })
  const [measureCount, setMeasureCount] = useState(2)
  // no autoplay!
  const [playing, setPlaying] = useState(false)
  // An EventTarget with React? Why?
  // Although the metronome settings (currentTick, BPM, etc) are all stored as state,
  // the metronome needs a way to communicate to components that a beat occured.
  // As far as I know, there is no natural way to subscribe to state changes in an event-driven way,
  // but given that we're running in a browser, EventTargets are still a totally natural way
  // to build a pub/sub notification system.
  const events = useRef(new EventTarget())

  async function togglePlaying() {
    if (playing) {
      await audioRouter.suspend()
      setPlaying(false)
    } else {
      // await audioRouter.init()
      await audioRouter.resume()
      // setTimeout(() => , 100)
      setPlaying(true)
    }
  }

  // const incrementBeat = useCallback(() => {
  //   const isFirstBeat =
  //     (currentTick + 1) % (timeSignature.beatsPerMeasure * measureCount) === 0
  //   if (isFirstBeat) {
  //     events.current.dispatchEvent(new Event('loopstart'))
  //   }
  //   events.current.dispatchEvent(new Event('beat'))
  //   // audioRouter.playTone(
  //   //   // audioRouter.audioContext.currentTime, // TODO: hmmm...
  //   //   (currentTick + 1) % timeSignature.beatsPerMeasure === 0
  //   // )
  //   // Advance the beat number, wrap to zero when reaching end of measure
  //   setCurrentTick(
  //     (value) => (value + 1) % (timeSignature.beatsPerMeasure * measureCount)
  //   )
  // }, [currentTick, measureCount, timeSignature.beatsPerMeasure])

  useEffect(() => {
    if (!playing) {
      return
    }
    const incrementBeat = () => {
      console.log({ incrementBeatCalled: true })
      const isFirstBeat =
        (currentTick + 1) % (timeSignature.beatsPerMeasure * measureCount) === 0
      if (isFirstBeat) {
        events.current.dispatchEvent(new Event('loopstart'))
      }
      events.current.dispatchEvent(new Event('beat'))

      // Advance the beat number, wrap to zero when reaching end of measure
      setCurrentTick(
        (value) => (value + 1) % (timeSignature.beatsPerMeasure * measureCount)
      )
    }
    console.log(audioRouter.audioContext?.state)
    if (audioRouter.audioContext?.state === 'running') {
      // copied from https://blog.paul.cx/post/metronome/
      const audioCtx = audioRouter.audioContext
      // const audioCtx = new AudioContext()
      const buffer = audioCtx.createBuffer(
        1,
        audioCtx.sampleRate * (60 / bpm),
        audioCtx.sampleRate
      )
      const channel = buffer.getChannelData(0)

      // create a quickly decaying sine wave
      const durationMs = 100
      const durationFrames = buffer.sampleRate / (1000 / durationMs)
      let metronomeVolume = 0.5
      const volumeDecayRate = metronomeVolume / durationFrames
      const frequency = 330

      const samplesPerWave = buffer.sampleRate / frequency
      // I'm not exactly sure what to call this
      const sampleWaveDisplacement = samplesPerWave / 2 / Math.PI

      for (var i = 0; i < durationFrames; i++) {
        channel[i] = Math.sin(i / sampleWaveDisplacement) * metronomeVolume
        metronomeVolume -= volumeDecayRate
      }

      console.debug({
        amp: metronomeVolume,
        samplesPerSine: samplesPerWave,
      })

      const source = new AudioBufferSourceNode(audioCtx, {
        buffer,
        loop: true,
        loopEnd: 60 / bpm,
      })
      source.connect(audioCtx.destination)
      source.addEventListener('ended', incrementBeat)
      source.start(0)
      console.debug({ metronomeStarted: true })

      return () => {
        source.removeEventListener('ended', incrementBeat)
        source.stop()
      }
    }
  }, [
    audioRouter.audioContext,
    audioRouter.audioContext?.state,
    // incrementBeat,
    bpm,
    currentTick,
    setCurrentTick,
    timeSignature.beatsPerMeasure,
    measureCount,
    playing,
  ])

  // The Web Audio API documentation has a substantially more involved looking description of how to make this work:
  //    https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques#playing_the_audio_in_time
  // For now, this seems to be working ok and it accomplishes the basic goal
  // useInterval(
  //   () => {
  //     const isFirstBeat =
  //       (currentTick + 1) % (timeSignature.beatsPerMeasure * measureCount) === 0
  //     if (isFirstBeat) {
  //       events.current.dispatchEvent(new Event('loopstart'))
  //     }
  //     events.current.dispatchEvent(new Event('beat'))
  //     audioRouter.playTone(
  //       // audioRouter.audioContext.currentTime, // TODO: hmmm...
  //       (currentTick + 1) % timeSignature.beatsPerMeasure === 0
  //     )
  //     // Advance the beat number, wrap to zero when reaching end of measure
  //     setCurrentTick(
  //       (value) => (value + 1) % (timeSignature.beatsPerMeasure * measureCount)
  //     )
  //   },
  //   playing ? (60 / bpm) * 1000 : null
  // )

  // TODO: this is logging twice, which probably means it's mounting twice and not getting cleared when the first one unmounts
  // it probably is not an issue this early in development but should be handled eventually
  // console.debug({ currentTick })
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
