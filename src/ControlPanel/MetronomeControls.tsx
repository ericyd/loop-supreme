import { useCallback, useEffect } from 'react'
import PlayPause from '../icons/PlayPause'
import { useKeyboard } from '../KeyboardProvider'
import { VolumeControl } from './VolumeControl'

type MetronomeControlProps = {
  playing: boolean
  muted: boolean
  togglePlaying(): void
  setMuted: React.Dispatch<React.SetStateAction<boolean>>
  setGain(gain: number): void
  gain: number
}
export default function MetronomeControl(props: MetronomeControlProps) {
  const keyboard = useKeyboard()
  const toggleMuted = useCallback(() => {
    props.setMuted((muted) => !muted)
  }, [props])

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
        props.togglePlaying()
        e.preventDefault()
      }
    })
  }, [keyboard, props, toggleMuted])

  return (
    <div className="flex items-start content-center mb-2 mr-2">
      <PlayPause onClick={props.togglePlaying} playing={props.playing} />

      <VolumeControl
        muted={props.muted}
        toggleMuted={toggleMuted}
        gain={props.gain}
        onChange={props.setGain}
      />
    </div>
  )
}
