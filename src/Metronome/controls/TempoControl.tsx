import { useCallback, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useKeybindings } from '../../hooks/use-keybindings'
import { ControlPanelItem } from '../ControlPanelItem'

type TempoProps = {
  onChange(bpm: number): void
  defaultValue: number
}
export function TempoControl({ onChange, defaultValue }: TempoProps) {
  const [bpm, setBpm] = useState(defaultValue)
  const [taps, setTaps] = useState<number[]>([])

  const debouncedOnChange = useDebouncedCallback(onChange, 100, {
    leading: true,
    trailing: false,
  })

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const bpm = Number(event.target.value)
    if (Number.isNaN(bpm)) {
      throw new Error(
        `Could not convert bpm "${event.target.value}" to numeric`
      )
    }
    debouncedOnChange(bpm)
    setBpm(bpm)
  }

  const handleTap = useCallback(() => {
    const lastTap = lastOr(taps)
    const now = Date.now()
    // allow 2 seconds between taps before resetting the counter
    if (now > lastTap + 2000) {
      setTaps([now])
    } else {
      setTaps((taps) => [...taps, now])
    }
    if (taps.length >= 2) {
      const averageMs = averageBetween(taps.slice(-3))
      const bpm = 60 / (averageMs / 1000)
      debouncedOnChange(bpm)
      setBpm(bpm)
    }
  }, [debouncedOnChange, taps])

  useKeybindings({
    t: { callback: handleTap, tagIgnoreList: ['BUTTON'] },
  })

  return (
    <ControlPanelItem>
      <div className="flex flex-row">
        <span className="text-4xl pr-3">{bpm.toFixed(1)}</span>
        <span className="text-sm">
          (t)ap
          <br />
          (t)empo
        </span>
      </div>
      <input
        type="range"
        onChange={handleChange}
        min={20}
        max={300}
        step={0.1}
        value={bpm}
        className="w-32"
      />
    </ControlPanelItem>
  )
}

function lastOr(ns: number[], fallback = 0) {
  return ns[ns.length - 1] ?? fallback
}

function average(ns: number[]) {
  return ns.reduce((sum, n) => sum + n, 0) / ns.length
}

// returns average delta between adjacent elements of the array
export function averageBetween(ns: number[]) {
  return average(ns.map((n, i) => n - ns[Math.max(i - 1, 0)]).slice(1))
}
