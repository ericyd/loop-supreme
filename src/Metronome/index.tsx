import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAudioRouter } from '../AudioRouter'
import { ControlPanel } from '../ControlPanel'
import { Scene } from '../Scene'
import { ClockConsumerMessage } from '../worklets/ClockWorker'
import { decayingSine } from './waveforms'

type TimeSignature = {
  beatsPerMeasure: number
  // 4 = quarter note
  // 8 = eighth note
  // etc
  beatUnit: number
}

export type MetronomeReader = {
  bpm: number
  currentTick: number
  timeSignature: TimeSignature
  measureCount: number
  currentMeasure: number
  playing: boolean
  clock: Worker
}

export type MetronomeWriter = {
  setBpm: (bpm: number) => void
  setTimeSignature: (timeSignature: TimeSignature) => void
  setMeasureCount: (count: number) => void
  togglePlaying: () => Promise<void>
}

type Props = {
  children?: React.ReactNode
}

export const Metronome: React.FC<Props> = () => {
  const { audioContext } = useAudioRouter()
  const [currentTick, setCurrentTick] = useState(-1)
  const [bpm, setBpm] = useState(120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    beatsPerMeasure: 4,
    beatUnit: 4,
  })
  const [measureCount, setMeasureCount] = useState(2)
  // no autoplay!
  const [playing, setPlaying] = useState(false)

  // Thanks SO! https://stackoverflow.com/a/71134400/3991555
  const clock = useRef<Worker>(
    new Worker(new URL('../worklets/clock', import.meta.url))
  )
  useEffect(() => {
    // create 2 metronome beeps for different frequencies
    const buffer330 = audioContext.createBuffer(
      1,
      audioContext.sampleRate * (60 / bpm),
      audioContext.sampleRate
    )
    buffer330.copyToChannel(decayingSine(buffer330.sampleRate), 0)
    const buffer380 = audioContext.createBuffer(
      1,
      audioContext.sampleRate * (60 / bpm),
      audioContext.sampleRate
    )
    buffer380.copyToChannel(decayingSine(buffer380.sampleRate, 380), 0)

    // TODO: should this callback be moved somewhere else?
    clock.current.addEventListener(
      'message',
      (event: MessageEvent<ClockConsumerMessage>) => {
        if (event.data.message === 'tick') {
          console.log(event.data)
          const { currentTick } = event.data
          setCurrentTick(currentTick)

          // emit a "beep" noise for the metronome
          const source = new AudioBufferSourceNode(audioContext, {
            buffer: event.data.downbeat ? buffer380 : buffer330,
          })
          const gain = new GainNode(audioContext, {
            gain: 0.5,
          })
          source.connect(gain)
          gain.connect(audioContext.destination)
          source.start()
        }
      }
    )
  }, [])

  async function togglePlaying() {
    if (playing) {
      await audioContext.suspend()
      clock.current.postMessage({
        message: 'stop',
      })
      setPlaying(false)
    } else {
      await audioContext.resume()

      clock.current.postMessage({
        bpm,
        beatsPerMeasure: timeSignature.beatsPerMeasure,
        measureCount,
        message: 'start',
      })

      setPlaying(true)
    }
  }

  useEffect(() => {
    clock.current.postMessage({
      bpm,
      beatsPerMeasure: timeSignature.beatsPerMeasure,
      measureCount,
      message: 'update',
    })
  }, [bpm, timeSignature.beatsPerMeasure, measureCount])

  // TODO: this is logging twice, which probably means it's mounting twice and not getting cleared when the first one unmounts
  // it probably is not an issue this early in development but should be handled eventually
  // console.debug({ currentTick })
  const reader: MetronomeReader = {
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
    clock: clock.current!,
  }
  const writer: MetronomeWriter = {
    setBpm,
    setTimeSignature,
    setMeasureCount,
    togglePlaying,
  }
  return (
    <>
      <ControlPanel metronome={reader} metronomeWriter={writer} />
      <Scene metronome={reader} />
    </>
  )
}
