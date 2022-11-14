import ControlPanelItem from './ControlPanelItem'

type MeasureCountProps = {
  onChange(measureCount: number): void
  measureCount: number
}
export default function MeasureCount(props: MeasureCountProps) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const measureCount = Number(event.target.value)
    if (Number.isNaN(measureCount)) {
      throw new Error(`measure count "${event.target.value}" is not a number`)
    }
    props.onChange(measureCount)
  }

  return (
    <ControlPanelItem>
      <div>
        <span className="font-serif text-4xl pr-3">{props.measureCount}</span>
        <span className="font-serif text-xl">
          measure{props.measureCount === 1 ? '' : 's'}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="4"
        step="1"
        value={props.measureCount}
        onChange={handleChange}
      />
    </ControlPanelItem>
  )
}
