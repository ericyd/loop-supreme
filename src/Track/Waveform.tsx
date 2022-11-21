import { useEffect, useState } from 'react'
import {
  WaveformControllerMessage,
  WaveformWorkerInitializeMessage,
} from '../worklets/waveform'

type Props = {
  worker: Worker
  sampleRate: number
}
export default function Waveform(props: Props) {
  const [path, setPath] = useState('M 0 0')

  const yMax = 2
  const xMax = 20
  useEffect(() => {
    props.worker.postMessage({
      message: 'INITIALIZE',
      yMax,
      xMax,
      sampleRate: props.sampleRate,
    } as WaveformWorkerInitializeMessage)
  })

  useEffect(() => {
    props.worker.addEventListener(
      'message',
      (event: MessageEvent<WaveformControllerMessage>) => {
        if (event.data.message === 'WAVEFORM_PATH') {
          setPath(event.data.path)
        }
      }
    )
  })

  return (
    <svg
      clipRule="evenodd"
      fillRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      viewBox={`0 ${-yMax / 2} ${xMax} ${yMax}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <path
        className="fill-zinc-200 stroke-black"
        strokeWidth={0.01}
        d={path}
      />
    </svg>
  )
}
