import ButtonBase from '../ButtonBase'
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
    <div className="flex flex-row items-center mr-2">
      <ButtonBase onClick={props.toggleMuted}>
        <Volume muted={props.muted} />
      </ButtonBase>
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
