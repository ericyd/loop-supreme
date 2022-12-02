import React from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { MetronomeReader, MetronomeState, MetronomeWriter } from '../Metronome'
import MeasuresPerLoop from './MeasuresPerLoop'
import TimeSignature from './TimeSignature'
import Tempo from './Tempo'
import BeatCounter from './BeatCounter'
import MetronomeControls from './MetronomeControls'

type Props = {
  metronome: MetronomeReader
  metronomeWriter: MetronomeWriter
  metronomeState: MetronomeState
}

export const ControlPanel: React.FC<Props> = ({
  metronome,
  metronomeWriter,
  metronomeState,
}) => {
  const setUpstreamBpm = useDebouncedCallback(metronomeWriter.setBpm, 100, {
    leading: true,
    trailing: false,
  })

  return (
    <div className="flex mb-12 items-end justify-between">
      <MetronomeControls
        playing={metronome.playing}
        muted={metronome.muted}
        togglePlaying={metronomeWriter.togglePlaying}
        setMuted={metronomeWriter.setMuted}
        setGain={metronomeWriter.setGain}
        gain={metronome.gain}
      />

      <div className="flex">
        <div className="flex flex-col items-center">
          <BeatCounter
            currentTick={metronomeState.currentTick}
            currentMeasure={metronomeState.currentMeasure}
          />

          <TimeSignature
            onChange={metronomeWriter.setTimeSignature}
            beatsPerMeasure={metronome.timeSignature.beatsPerMeasure}
            beatUnit={metronome.timeSignature.beatUnit}
          />
        </div>

        <Tempo onChange={setUpstreamBpm} defaultValue={metronome.bpm} />

        <MeasuresPerLoop
          onChange={metronomeWriter.setMeasuresPerLoop}
          measuresPerLoop={metronome.measuresPerLoop}
        />
      </div>
    </div>
  )
}
