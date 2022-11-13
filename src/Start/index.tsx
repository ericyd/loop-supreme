/**
 * This component exists because the Web Audio API has lots of mutable interfaces.
 * In addition, due to prohibition of auto-play, AudioContexts are only supposed
 * to be created *after* a user interacts with the page.
 * It seemed easier to wait until the user explicitly authorized media access
 * to create the AudioContext and the MediaStream.
 * The alternative was to use React state, or refs, to hold these.
 * The issue was that setting state is asynchronous, and if the AudioContext
 * is initiated immediately before it is required, then it is hard to know when it is acceptable
 * to *use* the AudioContext. Similarly for the MediaStream, it wasn't easy to set it to state
 * and then immediately use it in a recording.
 * The other compounding factor is that AudioContext is an inherently mutable interface;
 * for example, the `state` property changes when the context is running or suspended.
 * Refs work well for mutable data, but it removes a lot of the reactivity that makes React
 * useful in the first place.
 * Hence, passing as props (after the user affirmatively consents) felt like the simplest solution.
 */
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
      await audioContext.audioWorklet.addModule(
        new URL('../worklets/recorder.js', import.meta.url)
      )
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
