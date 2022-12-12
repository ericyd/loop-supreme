import { useMemo } from 'react'
import { Metronome } from '../Metronome'
import { Scene } from '../Scene'

export const Clock: React.FC = () => {
  /**
   * Instantiate the clock worker.
   * This is truly the heartbeat of the entire app 🥹
   * Workers should be loaded exactly once for a Component.
   * The `import.meta.url` is thanks to this SO answer https://stackoverflow.com/a/71134400/3991555,
   * which is just a digestible version of the webpack docs https://webpack.js.org/guides/web-workers/
   * I tried refactoring this into a custom hook but ran into all sorts of weird issues. This is easy enough so leaving as is
   */
  const clock = useMemo(
    () => new Worker(new URL('../workers/clock', import.meta.url)),
    []
  )

  return <Metronome clock={clock} />
}
