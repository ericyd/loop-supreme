import { ControlPanelItem } from './ControlPanelItem'

type MeasuresPerLoopProps = {
  onChange(measuresPerLoop: number): void
  measuresPerLoop: number
}
export function MeasuresPerLoopControl(props: MeasuresPerLoopProps) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const measuresPerLoop = Number(event.target.value)
    if (Number.isNaN(measuresPerLoop)) {
      throw new Error(`measure count "${event.target.value}" is not a number`)
    }
    props.onChange(measuresPerLoop)
  }

  return (
    <ControlPanelItem>
      <div>
        <span className="text-4xl pr-3">{props.measuresPerLoop}</span>
        <span className="text-xl">
          measure{props.measuresPerLoop === 1 ? '' : 's'}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="8"
        step="1"
        value={props.measuresPerLoop}
        onChange={handleChange}
        className="w-32"
      />
    </ControlPanelItem>
  )
}
