import ControlPanelItem from './ControlPanelItem'

type BeatCounterProps = {
  currentTick: number
  currentMeasure: number
}
export default function BeatCounter(props: BeatCounterProps) {
  return (
    <ControlPanelItem>
      <span className="font-serif text-4xl pr-3">
        {/* `+ 1` to convert "computer numbers" to "musician numbers"  */}
        {props.currentTick + 1}
      </span>
      <span className="font-serif text-xl">/ {props.currentMeasure + 1}</span>
    </ControlPanelItem>
  )
}
