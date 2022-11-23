import PlayPause from '../icons/PlayPause'
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
  const toggleMuted = () => {
    props.setMuted((muted) => !muted)
  }

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
