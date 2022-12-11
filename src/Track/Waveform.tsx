import { useEffect, useState } from 'react'
import {
  WaveformControllerMessage,
  WaveformWorkerInitializeMessage,
} from '../workers/waveform'

type Props = {
  worker: Worker
  sampleRate: number
}
export function Waveform({ worker, sampleRate }: Props) {
  const [path, setPath] = useState('M 0 0')

  const yMax = 2
  const xMax = 30
  useEffect(() => {
    worker.postMessage({
      message: 'INITIALIZE',
      yMax,
      xMax,
      sampleRate,
    } as WaveformWorkerInitializeMessage)
  })

  useEffect(() => {
    const messageHandler = (event: MessageEvent<WaveformControllerMessage>) => {
      if (event.data.message === 'WAVEFORM_PATH') {
        setPath(event.data.path)
      }
    }
    worker.addEventListener('message', messageHandler)
    return () => {
      worker.removeEventListener('message', messageHandler)
    }
  }, [worker])

  return (
    <svg
      clipRule="evenodd"
      fillRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      viewBox={`0 ${-yMax / 2} ${xMax} ${yMax}`}
      preserveAspectRatio="xMaxYMax"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <path
        className="fill-yellow dark:fill-purple stroke-black dark:stroke-white"
        strokeWidth={0.01}
        d={path}
      />
    </svg>
  )
}
