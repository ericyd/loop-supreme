import play from '../icons/iconmonstr-media-control-48.svg'
import pause from '../icons/iconmonstr-media-control-49.svg'
import { VolumeControl } from '../VolumeControl'

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
    <div className="flex items-start content-center mb-2">
      <button
        onClick={props.togglePlaying}
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
      >
        <img
          src={props.playing ? pause : play}
          alt={props.playing ? 'Pause' : 'Play'}
        />
      </button>

      <VolumeControl
        muted={props.muted}
        toggleMuted={toggleMuted}
        gain={props.gain}
        onChange={props.setGain}
      />
    </div>
  )
}
