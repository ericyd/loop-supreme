import ControlPanelItem from './ControlPanelItem'

type TempoProps = {
  handleChange: React.ChangeEventHandler<HTMLInputElement>
  defaultValue: number
  value: string
}
export default function Tempo(props: TempoProps) {
  return (
    <ControlPanelItem>
      <div>
        <span className="font-serif text-4xl pr-3">{props.value}</span>
        <span className="font-serif text-xl">BPM</span>
      </div>
      <input
        type="range"
        onChange={props.handleChange}
        min={20}
        max={300}
        step={0.1}
        defaultValue={props.defaultValue}
      />
    </ControlPanelItem>
  )
}
