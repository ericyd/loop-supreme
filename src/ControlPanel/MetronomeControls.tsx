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
  const toggleMuted = () => {
    props.setMuted((muted) => !muted)
  }
  keyboard.on('c', toggleMuted)
  // kinda wish I could write "space" but I guess this is the way this works.
  keyboard.on(' ', () => {
    // Only toggle playing if another control element is not currently focused
    if (!['SELECT', 'BUTTON'].includes(document.activeElement?.tagName ?? '')) {
      props.togglePlaying()
    }
  })

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
