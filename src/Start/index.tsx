import { useState } from 'react'
import App from '../App'

export const Start: React.FC = () => {
  const [stream, setStream] = useState<MediaStream>()

  async function handleClick() {
    try {
      setStream(
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })
      )
    } catch (e) {
      // TODO: better error handling
      console.error(e)
    }
  }

  return stream ? (
    <App stream={stream} />
  ) : (
    <button onClick={handleClick}>Start</button>
  )
}
