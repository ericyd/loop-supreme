type Props = {
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
    <input
      type="range"
      min="0"
      // Allow slightly more than 1.0 gain, in case the track is very soft
      max="1.4"
      step="0.01"
      value={props.gain}
      onChange={handleChangeGain}
      className="w-full"
    />
  )
}
