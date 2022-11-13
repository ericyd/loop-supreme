import React from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { MetronomeReader, MetronomeWriter } from '../Metronome'
import play from '../icons/iconmonstr-media-control-48.svg'
import pause from '../icons/iconmonstr-media-control-49.svg'
import { Container } from '../Container'

type Props = {
  metronome: MetronomeReader
  metronomeWriter: MetronomeWriter
}

export const ControlPanel: React.FC<Props> = ({
  metronome,
  metronomeWriter,
}) => {
  const handleSetBpm: React.ChangeEventHandler<HTMLInputElement> =
    useDebouncedCallback(
      (event) => {
        const bpm = Number(event.target.value)
        if (Number.isNaN(bpm)) {
          throw new Error(
            `Could not convert bpm "${event.target.value}" to numeric`
          )
        }
        metronomeWriter.setBpm(bpm)
      },
      100,
      { leading: true, trailing: false }
    )

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
    <Container title="Control panel">
      <div className="flex items-start content-center mb-2">
        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2">
          <div>tick: {metronome.currentTick}</div>
        </div>

        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2">
          <div>measure: {metronome.currentMeasure}</div>
        </div>

        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2">
          {/* TODO: read directly from the input[type="range"] below. This reads the debounced value which is confusing from a UX perspective */}
          <div>bpm: {metronome.bpm}</div>
          <input
            type="range"
            onChange={handleSetBpm}
            min={20}
            max={300}
            step={0.1}
            defaultValue={metronome.bpm}
          />
        </div>

        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2">
          <div>time signature</div>
          <select
            onChange={handleSetTimeSignature}
            value={`${metronome.timeSignature.beatsPerMeasure}/${metronome.timeSignature.beatUnit}`}
          >
            <option value="4/4">4/4</option>
            <option value="7/8">7/8</option>
          </select>
        </div>

        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2">
          <div>measure count: {metronome.measureCount}</div>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={metronome.measureCount}
            onChange={handleChangeMeasureCount}
          />
        </div>

        <button
          onClick={metronomeWriter.togglePlaying}
          className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
        >
          <img
            src={metronome.playing ? pause : play}
            alt={metronome.playing ? 'Pause' : 'Play'}
          />
        </button>
      </div>
    </Container>
  )
}
