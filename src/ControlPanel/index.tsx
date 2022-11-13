import React, { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { MetronomeReader, MetronomeWriter } from '../Metronome'
import play from '../icons/iconmonstr-media-control-48.svg'
import pause from '../icons/iconmonstr-media-control-49.svg'

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
        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-grow mr-2">
          <span className="font-serif text-4xl pr-3">
            {/* `+ 1` to convert "computer numbers" to "musician numbers"  */}
            {metronome.currentTick + 1}
          </span>
          <span className="font-serif text-xl">
            / {metronome.currentMeasure + 1}
          </span>
        </div>

        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-grow mr-2">
          <div>
            <span className="font-serif text-4xl pr-3">
              {visualBpm.toFixed(1)}
            </span>
            <span className="font-serif text-xl">BPM</span>
          </div>
          <input
            type="range"
            onChange={handleSetBpm}
            min={20}
            max={300}
            step={0.1}
            defaultValue={metronome.bpm}
          />
        </div>

        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-grow mr-2">
          <select
            onChange={handleSetTimeSignature}
            value={`${metronome.timeSignature.beatsPerMeasure}/${metronome.timeSignature.beatUnit}`}
            className="p-2 font-serif text-4xl bg-white"
          >
            <option value="4/4">4/4</option>
            <option value="7/8">7/8</option>
          </select>
        </div>

        <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-grow mr-2">
          <div>
            <span className="font-serif text-4xl pr-3">
              {metronome.measureCount}
            </span>
            <span className="font-serif text-xl">
              measure{metronome.measureCount === 1 ? '' : 's'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={metronome.measureCount}
            onChange={handleChangeMeasureCount}
          />
        </div>
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
      </div>
    </div>
  )
}
