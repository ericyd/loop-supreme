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
import { useEffect, useState } from 'react'
import App from '../App'
import { logger } from '../util/logger'

export const Start: React.FC = () => {
  const [stream, setStream] = useState<MediaStream>()
  const [audioContext, setAudioContext] = useState<AudioContext>()
  const [latencySupported, setLatencySupported] = useState(true)

  useEffect(() => {
    const supportedConstraints =
      navigator.mediaDevices.getSupportedConstraints()
    // @ts-expect-error This is a documented property, and indeed it is `true` in Chrome https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSupportedConstraints/latency
    if (!supportedConstraints.latency) {
      setLatencySupported(false)
    }
  }, [])

  async function handleClick() {
    try {
      setStream(
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          // audio: {
          //   echoCancellation: true,
          //   autoGainControl: false,
          //   noiseSuppression: true,
          //   latency: 0,
          // },
          video: false,
        })
      )
    } catch (e) {
      // TODO: better error handling
      logger.error(e, 'Error getting user media')
    }

    const workletUrl = new URL('../worklets/recorder', import.meta.url)
    try {
      const audioContext = new AudioContext()

      // adding modules is async; since it needs to happen "on mount", this is probably the best place for it
      await audioContext.audioWorklet.addModule(workletUrl)
      setAudioContext(audioContext)
    } catch (e) {
      logger.error({
        e,
        message: 'Error loading recorder worklet',
        url: workletUrl,
        urlToString: workletUrl.toString(),
      })
    }
  }

  return stream && audioContext ? (
    <App stream={stream} audioContext={audioContext} />
  ) : (
    <>
      <div className="flex flex-col items-center justify-center mx-auto">
        {!latencySupported && <LatencyNotSupportedAlert />}
        <button
          onClick={handleClick}
          className="px-10 py-5 border-4 border-solid border-black rounded-sm text-xl font-serif font-bold bg-blue-200"
        >
          Start
        </button>
      </div>
    </>
  )
}

function LatencyNotSupportedAlert() {
  return (
    <div className="mb-5 font-bold bg-red-200 p-2 rounded-md">
      <p>Heads up!</p>
      <p>Your browser does not appear to report recording latency 😢.</p>
      <p>
        You are free to continue, but your loops will most likely fall behind
        the beat.
      </p>
      <p>For best results, try Chrome (we know, we tried, we're sorry)</p>
      <p>
        <a
          href="https://ericyd.hashnode.dev/loop-supreme-part-7-latency-and-adding-track-functionality"
          target="_blank"
          rel="noreferrer"
          className="underline text-cyan-600"
        >
          (why tho?)
        </a>
      </p>
    </div>
  )
}
