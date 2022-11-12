import { useState } from 'react'
import App from '../App'

export const Start: React.FC = () => {
  const [stream, setStream] = useState<MediaStream>()
  const [audioContext, setAudioContext] = useState<AudioContext>()

  async function handleClick() {
    try {
      setStream(
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })
      )
      const audioContext = new AudioContext()

      // adding modules is async; since it needs to happen "on mount", this is probably the best place for it
      // await audioContext.audioWorklet.addModule('worklets/click.js')
      setAudioContext(audioContext)
    } catch (e) {
      // TODO: better error handling
      console.error(e)
    }
  }

  return stream && audioContext ? (
    <App stream={stream} audioContext={audioContext} />
  ) : (
    <button onClick={handleClick}>Start</button>
  )
}
