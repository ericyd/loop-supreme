import React, { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { MetronomeReader, MetronomeWriter } from '../Metronome'
import MeasureCount from './MeasureCount'
import TimeSignature from './TimeSignature'
import Tempo from './Tempo'
import BeatCounter from './BeatCounter'
import MetronomeControls from './MetronomeControls'

type Props = {
  metronome: MetronomeReader
  metronomeWriter: MetronomeWriter
}

export const ControlPanel: React.FC<Props> = ({
  metronome,
  metronomeWriter,
}) => {
  const setUpstreamBpm = useDebouncedCallback(metronomeWriter.setBpm, 100, {
    leading: true,
    trailing: false,
  })

  return (
    <div className="flex flex-col">
      <div className="flex items-stretch justify-between content-center mb-2">
        <BeatCounter
          currentTick={metronome.currentTick}
          currentMeasure={metronome.currentMeasure}
        />

        <Tempo onChange={setUpstreamBpm} defaultValue={metronome.bpm} />

        <TimeSignature
          onChange={metronomeWriter.setTimeSignature}
          beatsPerMeasure={metronome.timeSignature.beatsPerMeasure}
          beatUnit={metronome.timeSignature.beatUnit}
        />

        <MeasureCount
          onChange={metronomeWriter.setMeasureCount}
          measureCount={metronome.measureCount}
        />
      </div>

      <MetronomeControls
        playing={metronome.playing}
        muted={metronome.muted}
        togglePlaying={metronomeWriter.togglePlaying}
        setMuted={metronomeWriter.setMuted}
        setGain={metronomeWriter.setGain}
        gain={metronome.gain}
      />
    </div>
  )
}
