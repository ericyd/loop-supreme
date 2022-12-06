import { useState } from 'react'
import { logger } from '../../util/logger'
import { deviceIdFromStream } from '../../util/device-id-from-stream'
import { useAudioContext } from '../../AudioProvider'

type Props = {
  defaultDeviceId: string
  setStream(stream: MediaStream): void
}

export function SelectInput(props: Props) {
  const { devices } = useAudioContext()
  const [selected, setSelected] = useState(props.defaultDeviceId)

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
      logger.error({
        e,
        event,
        message: 'Failed to create stream from selected device',
      })
    }
  }

  return (
    <select
      className="rounded-full bg-white border border-zinc-400 px-2 max-w-[50%] text-xs"
      onChange={handleChange}
      value={selected}
    >
      {devices.map((device) => (
        <option key={JSON.stringify(device)} value={device.deviceId}>
          {/* Chrome appends a weird hex ID to some inputs */}
          {device.label.replace(/\([a-z0-9]+:[a-z0-9]+\)/, '')}
        </option>
      ))}
    </select>
  )
}
