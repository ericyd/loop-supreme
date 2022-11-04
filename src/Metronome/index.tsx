import React from 'react'
import { useMetronome } from '../MetronomeContext'
export const Metronome: React.FC = () => {
  const [metronomeReader, metronomeWriter] = useMetronome()

  // TODO: debounce
  const handleSetBpm: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    // TODO: error handling in case this is ever not a number?
    metronomeWriter.setBpm(Number(event.target.value))
  }

  const handleSetTimeSignature: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    const [beatsPerMeasure, beatUnit] = event.target.value?.split('/')
    if (!beatsPerMeasure || !beatUnit) {
      throw new Error(`Could not parse time signature ${event.target.value}`)
    }
    // TODO: add validation for non-numeric values
    metronomeWriter.setTimeSignature({
      beatsPerMeasure: Number(beatsPerMeasure),
      beatUnit: Number(beatUnit),
    })
  }

  const handleChangeMeasureCount: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    metronomeWriter.setMeasureCount(Number(event.target.value))
  }

  return (
    <>
      <div>current tick: {metronomeReader.currentTick}</div>
      <div>current measure: {metronomeReader.currentMeasure}</div>
      <div>bpm: {metronomeReader.bpm}</div>
      <input
        type="range"
        onChange={handleSetBpm}
        min={20}
        max={300}
        step={0.1}
        value={metronomeReader.bpm}
      />
      <div>
        time signature: {metronomeReader.timeSignature.beatsPerMeasure}/
        {metronomeReader.timeSignature.beatUnit}
      </div>
      <select onChange={handleSetTimeSignature}>
        {/* TODO: set 4/4 by default */}
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
    </>
  )
}
