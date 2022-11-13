import ControlPanelItem from './ControlPanelItem'

type TimeSignatureProps = {
  handleChange: React.ChangeEventHandler<HTMLSelectElement>
  beatsPerMeasure: number
  beatUnit: number
}
export default function TimeSignature(props: TimeSignatureProps) {
  return (
    <ControlPanelItem>
      <select
        onChange={props.handleChange}
        value={`${props.beatsPerMeasure}/${props.beatUnit}`}
        className="font-serif text-4xl bg-white"
      >
        <option value="4/4">4/4</option>
        <option value="7/8">7/8</option>
      </select>
    </ControlPanelItem>
  )
}
