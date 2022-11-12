import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAudioRouter } from '../AudioRouter'
import { buildFloat32Array } from './beep'

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

type ClockEvent = {
  data: {
    currentTick: number
    // true on the first beat of each measure
    downbeat: boolean
    // true on the first beat of each loop
    loopStart: boolean
    message: string
  }
}

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

  const clock = useRef<Worker>()
  useEffect(() => {
    // create 2 metronome beeps for different frequencies
    const buffer330 = audioRouter.audioContext.createBuffer(
      1,
      audioRouter.audioContext.sampleRate * (60 / bpm),
      audioRouter.audioContext.sampleRate
    )
    buffer330.copyToChannel(buildFloat32Array(buffer330.sampleRate), 0)
    const buffer380 = audioRouter.audioContext.createBuffer(
      1,
      audioRouter.audioContext.sampleRate * (60 / bpm),
      audioRouter.audioContext.sampleRate
    )
    buffer380.copyToChannel(buildFloat32Array(buffer380.sampleRate, 380), 0)

    clock.current = new Worker('worklets/clock.js')
    // TODO: should this callback be moved somewhere else?
    clock.current?.addEventListener('message', (event: ClockEvent) => {
      if (event.data.message === 'tick') {
        console.log(event.data)
        const { currentTick } = event.data
        setCurrentTick(currentTick)

        // emit a "beep" noise for the metronome
        const source = new AudioBufferSourceNode(audioRouter.audioContext, {
          buffer: event.data.downbeat ? buffer380 : buffer330,
        })
        const gain = new GainNode(audioRouter.audioContext, {
          gain: 0.5,
        })
        source.connect(gain)
        gain.connect(audioRouter.audioContext.destination)
        source.start()

        // events.current.dispatchEvent(new Event('loopstart'))
        // events.current.dispatchEvent(new Event('beat'))
      }
    })
  }, [])

  async function togglePlaying() {
    if (playing) {
      await audioRouter.suspend()
      clock.current?.postMessage({
        message: 'stop',
      })
      setPlaying(false)
    } else {
      await audioRouter.resume()

      // TODO: need to update bpm, beats per measure, etc, when they change
      clock.current?.postMessage({
        bpm,
        beatsPerMeasure: timeSignature.beatsPerMeasure,
        measureCount,
        message: 'start',
      })

      setPlaying(true)
    }
  }

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
