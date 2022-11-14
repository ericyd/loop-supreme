import play from '../icons/iconmonstr-media-control-48.svg'
import pause from '../icons/iconmonstr-media-control-49.svg'
import volume from '../icons/iconmonstr-audio-21.svg'
import volumeMuted from '../icons/iconmonstr-audio-22.svg'

type MetronomeControlProps = {
  playing: boolean
  muted: boolean
  togglePlaying(): void
  setMuted(muted: boolean): void
  setGain(gain: number): void
  gain: number
}
export default function MetronomeControl(props: MetronomeControlProps) {
  const handleToggleMuted = () => {
    props.setMuted(!props.muted)
  }

  const handleChangeGain: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const gain = Number(event.target.value)
    if (Number.isNaN(gain)) {
      throw new Error(`gain "${event.target.value}" is not a number`)
    }
    props.setGain(gain)
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

      <div className="flex flex-row items-center">
        <button
          onClick={handleToggleMuted}
          className={`p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2 ${
            props.muted ? 'bg-red-400' : ''
          }`}
        >
          <img src={props.muted ? volumeMuted : volume} alt="Toggle mute" />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={props.gain}
          onChange={handleChangeGain}
        />
      </div>
    </div>
  )
}
