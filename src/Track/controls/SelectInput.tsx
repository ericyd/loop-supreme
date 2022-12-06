import { useEffect, useState } from 'react'
import { logger } from '../../util/logger'
import { deviceIdFromStream } from '../../util/device-id-from-stream'

type Props = {
  defaultDeviceId: string
  setStream(stream: MediaStream): void
}

export function SelectInput(props: Props) {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([])
  const [selected, setSelected] = useState(props.defaultDeviceId)

  useEffect(() => {
    async function getInputs() {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(
        (device) => device.kind === 'audioinput'
      )
      logger.debug({ audioInputs })
      setInputs(audioInputs)
    }

    getInputs()
  }, [])

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = async (
    event
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: event.target.value },
        video: false,
      })
      props.setStream(stream)
      setSelected(deviceIdFromStream(stream) ?? '')
    } catch (e) {
      alert('oh no, you broke it 😿')
      console.error(e)
    }
  }

  return (
    <select
      className="rounded-full bg-white border border-zinc-400 px-2 max-w-[50%] text-xs"
      onChange={handleChange}
      value={selected}
    >
      {inputs.map((input) => (
        <option key={JSON.stringify(input)} value={input.deviceId}>
          {/* Chrome appends a weird hex ID to some inputs */}
          {input.label.replace(/\([a-z0-9]+:[a-z0-9]+\)/, '')}
        </option>
      ))}
    </select>
  )
}
