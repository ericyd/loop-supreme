import { TimeSignature } from '..'
import { ControlPanelItem } from '../ControlPanelItem'

type TimeSignatureProps = {
  onChange(signature: TimeSignature): void
  beatsPerMeasure: number
  beatUnit: number
}
export function TimeSignatureControl(props: TimeSignatureProps) {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const [beatsPerMeasureStr, beatUnitStr] = event.target.value?.split('/')
    if (!beatsPerMeasureStr || !beatUnitStr) {
      throw new Error(`Could not parse time signature "${event.target.value}"`)
    }
    const [beatsPerMeasure, beatUnit] = [
      Number(beatsPerMeasureStr),
      Number(beatUnitStr),
    ]
    if (Number.isNaN(beatsPerMeasure) || Number.isNaN(beatUnit)) {
      throw new Error(
        `Could not convert time signature "${event.target.value}" to numeric values`
      )
    }
    props.onChange({
      beatsPerMeasure,
      beatUnit,
    })
  }

  return (
    <ControlPanelItem>
      <select
        onChange={handleChange}
        value={`${props.beatsPerMeasure}/${props.beatUnit}`}
        className="font-mono text-xl bg-white border border-solid border-zinc-400 rounded-full p-2"
      >
        <option value="4/4">4/4</option>
        <option value="7/8">7/8</option>
      </select>
    </ControlPanelItem>
  )
}
