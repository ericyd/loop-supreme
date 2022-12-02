import React, { useCallback, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { MetronomeReader, MetronomeState, MetronomeWriter } from '../Metronome'
import MeasuresPerLoop from './MeasuresPerLoop'
import TimeSignature from './TimeSignature'
import Tempo from './Tempo'
import BeatCounter from './BeatCounter'
import { VolumeControl } from './VolumeControl'
import PlayPause from '../icons/PlayPause'
import { useKeyboard } from '../KeyboardProvider'

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

  const keyboard = useKeyboard()
  const toggleMuted = useCallback(() => {
    metronomeWriter.setMuted((muted) => !muted)
  }, [metronomeWriter])

  useEffect(() => {
    keyboard.on('c', 'Metronome', toggleMuted)
    // kinda wish I could write "space" but I guess this is the way this works.
    keyboard.on(' ', 'Metronome', (e) => {
      // Only toggle playing if another control element is not currently focused
      if (
        !['INPUT', 'SELECT', 'BUTTON'].includes(
          document.activeElement?.tagName ?? ''
        )
      ) {
        metronomeWriter.togglePlaying()
        e.preventDefault()
      }
    })
  }, [keyboard, metronomeWriter, toggleMuted])

  return (
    <div className="flex mb-12 items-end justify-between">
      <div className="flex items-start content-center mb-2 mr-2">
        <PlayPause
          onClick={metronomeWriter.togglePlaying}
          playing={metronome.playing}
        />

        <VolumeControl
          muted={metronome.muted}
          toggleMuted={toggleMuted}
          gain={metronome.gain}
          onChange={metronomeWriter.setGain}
        />
      </div>

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
