import { useEffect, useState } from 'react'
import type { ClockControllerMessage } from '../workers/clock'
import { ControlPanelItem } from './ControlPanelItem'

type BeatCounterProps = {
  clock: Worker
  beatsPerMeasure: number
}
export function BeatCounter(props: BeatCounterProps) {
  const [currentTick, setCurrentTick] = useState(0)

  /**
   * Add clock event listeners
   */
  useEffect(() => {
    const clockMessageHandler = (
      event: MessageEvent<ClockControllerMessage>
    ) => {
      if (event.data.message === 'TICK') {
        setCurrentTick(event.data.currentTick)
      }
    }
    props.clock.addEventListener('message', clockMessageHandler)
    return () => {
      props.clock.removeEventListener('message', clockMessageHandler)
    }
  }, [props.clock, props.beatsPerMeasure])

  return (
    <ControlPanelItem>
      <span className="text-2xl pr-2">
        {/* `+ 1` to convert "computer numbers" to "musician numbers"  */}
        {(currentTick % props.beatsPerMeasure) + 1}
      </span>
      <span className="text-l">
        . {Math.floor(currentTick / props.beatsPerMeasure) + 1}
      </span>
    </ControlPanelItem>
  )
}
