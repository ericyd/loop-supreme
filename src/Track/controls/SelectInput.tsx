import { useCallback, useEffect, useState } from 'react'
import { logger } from '../../util/logger'
import { deviceIdFromStream } from '../../util/device-id-from-stream'
import { useAudioContext } from '../../AudioProvider'

type Props = {
  setStream(stream: MediaStream): void
}

export function SelectInput({ setStream }: Props) {
  const { devices, defaultDeviceId } = useAudioContext()
  const [selected, setSelected] = useState(defaultDeviceId)

  const setStreamByDeviceId = useCallback(
    async (id: string) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: id,

            // for some reason,
            // having these defined makes a HUGE difference in the recording quality.
            // Without these defined, the audio will pulse in and out, but with these defined, it sounds great
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
            suppressLocalAudioPlayback: false,
            latency: 0,
          },
          video: false,
        })
        setStream(stream)
        setSelected(deviceIdFromStream(stream) ?? '')
      } catch (e) {
        alert('oh no, you broke it 😿')
        logger.error({
          e,
          id,
          message: 'Failed to create stream from selected device',
        })
      }
    },
    [setStream]
  )

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = async (
    event
  ) => {
    return setStreamByDeviceId(event.target.value)
  }

  useEffect(() => {
    setStreamByDeviceId(defaultDeviceId)
  }, [setStreamByDeviceId, defaultDeviceId])

  return (
    <select
      className="rounded-full border border-light-gray dark:border-dark-gray bg-white dark:bg-black px-2 max-w-[50%] text-xs"
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
