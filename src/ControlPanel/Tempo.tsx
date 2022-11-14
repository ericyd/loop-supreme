import { useState } from 'react'
import ControlPanelItem from './ControlPanelItem'

type TempoProps = {
  onChange(bpm: number): void
  defaultValue: number
}
export default function Tempo(props: TempoProps) {
  const [visualBpm, setVisualBpm] = useState(120)
  // TODO: something about this isn't working right
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const bpm = Number(event.target.value)
    if (Number.isNaN(bpm)) {
      throw new Error(
        `Could not convert bpm "${event.target.value}" to numeric`
      )
    }
    props.onChange(bpm)
    setVisualBpm(bpm)
  }

  return (
    <ControlPanelItem>
      <div>
        <span className="font-serif text-4xl pr-3">{visualBpm}</span>
        <span className="font-serif text-xl">BPM</span>
      </div>
      <input
        type="range"
        onChange={handleChange}
        min={20}
        max={300}
        step={0.1}
        defaultValue={props.defaultValue}
      />
    </ControlPanelItem>
  )
}
