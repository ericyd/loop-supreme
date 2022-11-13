import ControlPanelItem from './ControlPanelItem'

type MeasureCountProps = {
  handleChange: React.ChangeEventHandler<HTMLInputElement>
  measureCount: number
}
export default function MeasureCount(props: MeasureCountProps) {
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
        onChange={props.handleChange}
      />
    </ControlPanelItem>
  )
}
