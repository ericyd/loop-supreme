import React, { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { MetronomeReader, MetronomeWriter } from '../Metronome'
import play from '../icons/iconmonstr-media-control-48.svg'
import pause from '../icons/iconmonstr-media-control-49.svg'
import ControlPanelItem from './ControlPanelItem'
import MeasureCount from './MeasureCount'
import TimeSignature from './TimeSignature'
import Tempo from './Tempo'
import BeatCounter from './BeatCounter'

type Props = {
  metronome: MetronomeReader
  metronomeWriter: MetronomeWriter
}

export const ControlPanel: React.FC<Props> = ({
  metronome,
  metronomeWriter,
}) => {
  const [visualBpm, setVisualBpm] = useState(120)
  const setUpstreamBpm = useDebouncedCallback(
    (bpm: number) => {
      metronomeWriter.setBpm(bpm)
    },
    100,
    { leading: true, trailing: false }
  )
  // TODO: something about this isn't working right
  const handleSetBpm: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const bpm = Number(event.target.value)
    if (Number.isNaN(bpm)) {
      throw new Error(
        `Could not convert bpm "${event.target.value}" to numeric`
      )
    }
    setUpstreamBpm(bpm)
    setVisualBpm(bpm)
  }

  const handleSetTimeSignature: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    const [beatsPerMeasureStr, beatUnitStr] = event.target.value?.split('/')
    if (!beatsPerMeasureStr || !beatUnitStr) {
      throw new Error(`Could not parse time signature "${event.target.value}"`)
    }
    const [beatsPerMeasure, beatUnit] = [
      Number(beatsPerMeasureStr),
      Number(beatUnitStr),
    ]
    if (Number.isNaN(beatsPerMeasure) || Number.isNaN(beatUnit)) {
      throw new Error(
        `Could not convert time signature "${event.target.value}" to numeric values`
      )
    }
    metronomeWriter.setTimeSignature({
      beatsPerMeasure,
      beatUnit,
    })
  }

  const handleChangeMeasureCount: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    metronomeWriter.setMeasureCount(Number(event.target.value))
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-stretch justify-between content-center mb-2">
        <BeatCounter
          currentTick={metronome.currentTick}
          currentMeasure={metronome.currentMeasure}
        />

        <Tempo
          handleChange={handleSetBpm}
          defaultValue={metronome.bpm}
          value={visualBpm.toFixed(1)}
        />

        <TimeSignature
          handleChange={handleSetTimeSignature}
          beatsPerMeasure={metronome.timeSignature.beatsPerMeasure}
          beatUnit={metronome.timeSignature.beatUnit}
        />

        <MeasureCount
          handleChange={handleChangeMeasureCount}
          measureCount={metronome.measureCount}
        />
      </div>

      <div className="flex items-start content-center mb-2">
        <button
          onClick={metronomeWriter.togglePlaying}
          className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
        >
          <img
            src={metronome.playing ? pause : play}
            alt={metronome.playing ? 'Pause' : 'Play'}
          />
        </button>

        <button
          onClick={() => {
            metronomeWriter.setMuted(!metronome.muted)
          }}
          className={`p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2 w-10 font-bold font-serif ${
            metronome.muted ? 'bg-red-400' : ''
          }`}
        >
          M
        </button>
      </div>
    </div>
  )
}
