import { useEffect, useState } from 'react'

type Props = {
  setStream(stream: MediaStream): void
}

export default function SelectInput(props: Props) {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    async function getInputs() {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(
        (device) => device.kind === 'audioinput'
      )
      console.log(audioInputs)
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
    } catch (e) {
      alert('oh no, you broke it 😿')
      console.error(e)
    }
  }

  return (
    <select
      className="rounded-full bg-white border border-zinc-900 px-2 max-w-min text-xs"
      onChange={handleChange}
    >
      {inputs.map((input) => (
        <option value={input.deviceId}>{input.label}</option>
      ))}
    </select>
  )
}
