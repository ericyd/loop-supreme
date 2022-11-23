import ControlPanelItem from './ControlPanelItem'

type BeatCounterProps = {
  currentTick: number
  currentMeasure: number
}
export default function BeatCounter(props: BeatCounterProps) {
  return (
    <ControlPanelItem>
      <span className="font-mono text-2xl pr-2">
        {/* `+ 1` to convert "computer numbers" to "musician numbers"  */}
        {props.currentTick + 1}
      </span>
      <span className="font-mono text-l">. {props.currentMeasure + 1}</span>
    </ControlPanelItem>
  )
}
