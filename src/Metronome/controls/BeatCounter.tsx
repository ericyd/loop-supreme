import { useEffect, useState } from 'react'
import type { ClockControllerMessage } from '../../workers/clock'
import { ControlPanelItem } from './ControlPanelItem'

type BeatCounterProps = {
  clock: Worker
  beatsPerLoop: number
  loopLengthSeconds: number
  playing: boolean
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
  }, [props.clock])

  return (
    <ControlPanelItem>
      <svg
        version="1.1"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-10 w-10"
      >
        <circle
          cx="50%"
          cy="50%"
          r={9}
          fill="none"
          className={`stroke-black stroke-2`}
          style={{
            animationName: 'circle-stroke-shrink-9-radius',
            strokeDasharray: 56.55,
            // this is "x2" because the animation is designed to shrink, and then regrow the stroke.
            // see index.css for more details.
            animationDuration: `${props.loopLengthSeconds * 2}s`,
            animationTimingFunction: 'linear',
            animationDelay: '0s',
            animationIterationCount: 'infinite',
            animationDirection: 'normal',
            animationFillMode: 'none',
            animationPlayState: props.playing ? 'running' : 'paused',
          }}
        />
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fontSize="0.65em">
          {props.beatsPerLoop - currentTick}
        </text>
      </svg>
    </ControlPanelItem>
  )
}
