import React from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useMetronome } from '../MetronomeContext'
export const Metronome: React.FC = () => {
  const [metronomeReader, metronomeWriter] = useMetronome()

  const handleSetBpm: React.ChangeEventHandler<HTMLInputElement> =
    useDebouncedCallback((event) => {
      const bpm = Number(event.target.value)
      if (Number.isNaN(bpm)) {
        throw new Error(
          `Could not convert bpm "${event.target.value}" to numeric`
        )
      }
      metronomeWriter.setBpm(bpm)
    }, 100)

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
    <div className="p-2 border border-zinc-400 border-solid rounded-md">
      <h2 className="font-bold text-xl">Metronome</h2>
      <div>current tick: {metronomeReader.currentTick}</div>
      <div>current measure: {metronomeReader.currentMeasure}</div>
      {/* TODO: read directly from the input[type="range"] below. This reads the debounced value which is confusing form a UX perspective */}
      <div>bpm: {metronomeReader.bpm}</div>
      <input
        type="range"
        onChange={handleSetBpm}
        min={20}
        max={300}
        step={0.1}
        defaultValue={metronomeReader.bpm}
      />
      <div>
        time signature: {metronomeReader.timeSignature.beatsPerMeasure}/
        {metronomeReader.timeSignature.beatUnit}
      </div>
      <select
        onChange={handleSetTimeSignature}
        value={`${metronomeReader.timeSignature.beatsPerMeasure}/${metronomeReader.timeSignature.beatUnit}`}
      >
        <option value="4/4">4/4</option>
        <option value="7/8">7/8</option>
      </select>
      <div>measure count: {metronomeReader.measureCount}</div>
      <input
        type="range"
        min="1"
        max="4"
        step="1"
        value={metronomeReader.measureCount}
        onChange={handleChangeMeasureCount}
      />
    </div>
  )
}
