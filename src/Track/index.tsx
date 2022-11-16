import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react'
import { useAudioRouter } from '../AudioRouter'
import { Record } from '../icons/Record'
import { X } from '../icons/X'
import { MetronomeReader } from '../Metronome'
import { logger } from '../util/logger'
import { VolumeControl } from '../VolumeControl'
import { ClockConsumerMessage } from '../worklets/ClockWorker'

type Props = {
  id: number
  onRemove(): void
  metronome: MetronomeReader
}

const red = '#ef4444'
const black = '#000000'

type RecordingProperties = {
  numberOfChannels: number
  sampleRate: number
  maxFrameCount: number
  latencySamples: number
}

type MaxRecordingLengthReachedMessage = {
  message: 'MAX_RECORDING_LENGTH_REACHED'
}

type UpdateRecordingLengthMessage = {
  message: 'UPDATE_RECORDING_LENGTH'
  recordingLength: number
}

type ShareRecordingBufferMessage = {
  message: 'SHARE_RECORDING_BUFFER'
  buffer: Array<Float32Array>
}

type RecordingMessage =
  | MaxRecordingLengthReachedMessage
  | UpdateRecordingLengthMessage
  | ShareRecordingBufferMessage

export const Track: React.FC<Props> = ({ id, onRemove, metronome }) => {
  const { audioContext, stream } = useAudioRouter()
  const [title, setTitle] = useState(`Track ${id}`)
  const [armed, setArmed] = useState(false)
  const [recording, setRecording] = useState(false)
  // TODO: should I be using a tailwind class for this?
  const [recordButtonColor, setRecordButtonColor] = useState(
    recording ? red : black
  )
  const [gain, setGain] = useState(1)
  const [muted, setMuted] = useState(false)
  const toggleMuted = () => setMuted((muted) => !muted)
  // Refs vs State ... still learning.
  // I believe this is correct because if the GainNode were a piece of State,
  // then the GainNode would be re-instantiated every time the gain changed.
  // That would destroy the audio graph that gets connected when the track is playing back.
  // The audio graph should stay intact, so mutating the gain value directly is (I believe) the correct way to achieve this.
  const gainNode = useRef(new GainNode(audioContext, { gain }))
  useEffect(() => {
    gainNode.current.gain.value = muted ? 0.0 : gain
  }, [gain, muted])

  function getLatencySamples(sampleRate: number, stream: MediaStream): number {
    const supportedConstraints =
      navigator.mediaDevices.getSupportedConstraints()
    // @ts-expect-error This is a documented property, and indeed it is `true` in Chrome https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSupportedConstraints/latency
    if (!supportedConstraints.latency) {
      // TODO: should we make a guess about recording latency?
      // Even in browsers where this is not reported, it is clear that latency is non-zero.
      // In very simple tests, it is often > 100ms
      logger.log({
        message:
          'Could not get track latency because this environment does not report latency on MediaStreamTracks',
        supportedConstraints,
      })
      return 0
    }
    const recordingStreamLatency = stream
      .getAudioTracks()
      .reduce((maxChannelLatency, channel, i) => {
        // In Chrome, this is the best (only?) way to get the track latency
        // Strangely, it isn't even documented on MDN https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities
        const capabilitiesLatency =
          typeof channel.getCapabilities === 'function' &&
          channel.getCapabilities?.()?.latency?.max
        if (typeof capabilitiesLatency === 'number') {
          return Math.max(maxChannelLatency, capabilitiesLatency)
        }
        logger.debug({
          message: 'Could not get capabilities, or latency was not a number',
          channel: i,
          typeofGetCapabilities: typeof channel.getCapabilities,
          capabilitiesLatency,
        })

        // this should be an alternative, but doesn't appear to be populated in Firefox https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/latency
        const constraintLatency =
          typeof channel.getConstraints === 'function' &&
          channel.getConstraints?.()?.latency
        if (typeof constraintLatency === 'number') {
          return Math.max(maxChannelLatency, constraintLatency)
        }
        logger.debug({
          message: 'Could not get constraints, or latency was not a number',
          channel: i,
          typeofGetConstraints: typeof channel.getConstraints,
          constraintLatency,
        })

        // this is yet another alternative according to MDN but not implemented in major browsers yet https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/latency
        // Just leaving as a fall back in case browsers implement in the future
        const settingsLatency =
          typeof channel.getSettings === 'function' &&
          // @ts-expect-error lib.dom.d.ts doesn't believe this is a valid option (which I suppose is technically true)
          channel.getSettings?.()?.latency
        if (typeof settingsLatency === 'number') {
          return Math.max(maxChannelLatency, settingsLatency)
        }
        logger.debug({
          message: 'Could not get settings, or latency was not a number',
          channel: i,
          typeofGetSettings: typeof channel.getSettings,
          settingsLatency,
        })

        return maxChannelLatency
      }, 0)

    const latencySeconds = Math.max(
      audioContext.baseLatency,
      audioContext.outputLatency,
      recordingStreamLatency
    )
    logger.debug({
      'audioContext.baseLatency': audioContext.baseLatency,
      'audioContext.outputLatency': audioContext.outputLatency,
      recordingStreamLatency,
      latencySeconds,
    })
    return Math.ceil(latencySeconds * sampleRate)
  }

  const recorderWorklet = useRef<AudioWorkletNode>()
  useEffect(() => {
    const mediaSource = audioContext.createMediaStreamSource(stream)
    const recordingProperties: RecordingProperties = {
      numberOfChannels: mediaSource.channelCount,
      sampleRate: audioContext.sampleRate,
      maxFrameCount: audioContext.sampleRate * 10,
      latencySamples: getLatencySamples(audioContext.sampleRate, stream),
    }
    recorderWorklet.current = new AudioWorkletNode(audioContext, 'recorder', {
      processorOptions: recordingProperties,
    })

    const monitorNode = audioContext.createGain()

    // We can pass this port across the app
    // and let components handle their relevant messages
    const recordingCallback = handleRecording(recordingProperties)

    // setupMonitor(monitorNode);

    // Wanna have your mind blown?
    // Adding an event listener to this port with `addEventListener` simply doesn't work!
    // go ahead and try it:
    // recorderWorklet.current.port.addEventListener('message', console.log.bind(console))
    recorderWorklet.current.port.onmessage = recordingCallback

    mediaSource
      .connect(recorderWorklet.current)
      .connect(monitorNode)
      .connect(audioContext.destination)

    return () => {
      // TODO: how do I get the track to stop playing?
      // I guess I need to stop the bufferSource... which means I need another piece of state or a ref
      if (recorderWorklet.current) {
        recorderWorklet.current.disconnect()
        recorderWorklet.current.port.onmessage = () => {}
        recorderWorklet.current = undefined
      }
      mediaSource.disconnect()
    }
  }, [])

  function handleRecording(recordingProperties: RecordingProperties) {
    let recordingLength = 0

    // If the max length is reached, we can no longer record.
    return (event: MessageEvent<RecordingMessage>) => {
      if (event.data.message === 'MAX_RECORDING_LENGTH_REACHED') {
        // isRecording = false;
        logger.log(event.data)
      }
      if (event.data.message === 'UPDATE_RECORDING_LENGTH') {
        recordingLength = event.data.recordingLength
      }
      if (event.data.message === 'SHARE_RECORDING_BUFFER') {
        const recordingBuffer = audioContext.createBuffer(
          recordingProperties.numberOfChannels,
          recordingLength,
          audioContext.sampleRate
        )

        for (let i = 0; i < recordingProperties.numberOfChannels; i++) {
          // buffer is an Array of Float32Arrays;
          // each element of Array is a channel,
          // which contains the raw samples for the audio data of that channel
          recordingBuffer.copyToChannel(
            // copyToChannel accepts an optional 3rd argument, "startInChannel"[1] (or "bufferOffset" depending on your source).
            // which is described as
            //    > An optional offset to copy the data to
            // The way this works is it actually inserts silence at the beginning of the **target channel** for `startInChannel` samples[2].
            // I believe the intended use case is to synchronize audio playback with other media (e.g. video).
            // However, in this case, we are trying to align recorded audio with the start of the loop.
            // In this case we need to **subtract** audio from the buffer, in accordance with the latency of the recording device.
            // See `worklets/recorder` for the buffer offset
            // [1] https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/copyToChannel
            // [2] https://jsfiddle.net/y7qL9wr4/7
            // TODO: should this be sliced to a maximum of buffer size? Maybe a non-issue?
            event.data.buffer[i],
            i,
            0
          )
        }

        const bufferSource = new AudioBufferSourceNode(audioContext, {
          buffer: recordingBuffer,
          loop: true,
        })

        gainNode.current.connect(audioContext.destination)
        bufferSource.connect(gainNode.current)
        bufferSource.start()

        return recordingBuffer
      }
    }
  }

  const handleChangeTitle: ChangeEventHandler<HTMLInputElement> = (event) => {
    setTitle(event.target.value)
  }

  // if track is armed, toggle the color between red and black every half-beat
  function handleBeat() {
    if (armed) {
      setRecordButtonColor(red)
      setTimeout(() => {
        setRecordButtonColor(black)
      }, (60 / metronome.bpm / 2) * 1000)
    }
  }

  function handleLoopstart() {
    if (recording) {
      setRecording(false)
      recorderWorklet.current?.port?.postMessage({
        message: 'UPDATE_RECORDING_STATE',
        setRecording: false,
      })
    }
    if (armed) {
      setRecording(true)
      setArmed(false)
      setRecordButtonColor(red)
      recorderWorklet.current?.port?.postMessage({
        message: 'UPDATE_RECORDING_STATE',
        setRecording: true,
      })
    }
  }

  function delegateClockMessage(event: MessageEvent<ClockConsumerMessage>) {
    if (event.data.message === 'tick') {
      handleBeat()
    }
    if (event.data.loopStart) {
      handleLoopstart()
    }
  }

  useEffect(() => {
    metronome.clock.addEventListener('message', delegateClockMessage)
    return () => {
      metronome.clock.removeEventListener('message', delegateClockMessage)
    }
  })

  // TODO: need some sort of global lock to prevent recording to multiple tracks at once
  async function handleArmRecording() {
    if (armed) {
      setArmed(false)
      return
    }
    setArmed(true)
  }

  return (
    <div className="flex items-start content-center mb-2">
      <input
        value={title}
        onChange={handleChangeTitle}
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
      />
      {/* TODO: make a "confirm" flow so tracks are not accidentally deleted */}
      <button
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
        onClick={onRemove}
      >
        <X />
      </button>
      <button
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
        onClick={handleArmRecording}
      >
        {/* TODO: two pieces of state for a ... button color????? 🤮🤮🤮 */}
        <Record fill={recording ? red : recordButtonColor} />
      </button>
      <VolumeControl
        muted={muted}
        toggleMuted={toggleMuted}
        gain={gain}
        onChange={setGain}
      />
    </div>
  )
}
