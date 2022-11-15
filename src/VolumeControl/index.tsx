import { Volume } from '../icons/Volume'

type Props = {
  muted: boolean
  toggleMuted(): void
  gain: number
  onChange(gain: number): void
}

export const VolumeControl: React.FC<Props> = (props) => {
  const handleChangeGain: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const gain = Number(event.target.value)
    if (Number.isNaN(gain)) {
      throw new Error(`gain "${event.target.value}" is not a number`)
    }
    props.onChange(gain)
  }

  return (
    <div className="flex flex-row items-center">
      <button
        onClick={props.toggleMuted}
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
      >
        <Volume muted={props.muted} />
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
  )
}
