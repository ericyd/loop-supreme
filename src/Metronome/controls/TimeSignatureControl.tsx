import { TimeSignature } from '..'
import { ControlPanelItem } from './ControlPanelItem'

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

  const options = ['4/4', '3/4', '6/8', '7/8', '9/8']

  return (
    <ControlPanelItem>
      <select
        onChange={handleChange}
        value={`${props.beatsPerMeasure}/${props.beatUnit}`}
        className="text-xl border border-solid border-light-gray dark:border-dark-gray bg-white dark:bg-black rounded-full p-2"
      >
        {options.map((opt) => (
          <option value={opt} key={opt}>
            {opt}
          </option>
        ))}
      </select>
    </ControlPanelItem>
  )
}
