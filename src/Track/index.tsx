import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react'
import { useAudioRouter } from '../AudioRouter'
import { Monitor } from '../icons/Monitor'
import { Record } from '../icons/Record'
import { X } from '../icons/X'
import { MetronomeReader } from '../Metronome'
import { logger } from '../util/logger'
import { VolumeControl } from '../VolumeControl'
import { ClockConsumerMessage } from '../worklets/ClockWorker'
import { getLatencySamples } from './get-latency-samples'

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
  maxRecordingFrames: number
  latencySamples: number
  /**
   * default: false
   */
  monitorInput?: boolean
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
  const toggleMuted = () => setMuted((value) => !value)
  // Refs vs State ... still learning.
  // I believe this is correct because if the GainNode were a piece of State,
  // then the GainNode would be re-instantiated every time the gain changed.
  // That would destroy the audio graph that gets connected when the track is playing back.
  // The audio graph should stay intact, so mutating the gain value directly is (I believe) the correct way to achieve this.
  const gainNode = useRef(new GainNode(audioContext, { gain }))
  useEffect(() => {
    gainNode.current.gain.value = muted ? 0.0 : gain
  }, [gain, muted])

  const [monitorInput, setMonitorInput] = useState(false)
  const toggleMonitoring = () => setMonitorInput((value) => !value)

  const recorderWorklet = useRef<AudioWorkletNode>()

  /**
   * Monitoring is performed in the recorder worklet.
   * When monitoring is enabled/disabled, the worklet must be notified via message.
   */
  useEffect(() => {
    recorderWorklet.current?.port?.postMessage({
      message: 'UPDATE_MONITORING_STATE',
      monitorInput,
    })
  }, [monitorInput])

  /**
   * On mount, create a media stream source from the user's input stream.
   * Initialize the recorder worklet, and connect the audio graph for eventual playback.
   */
  useEffect(() => {
    const mediaSource = audioContext.createMediaStreamSource(stream)
    const recordingProperties: RecordingProperties = {
      numberOfChannels: mediaSource.channelCount,
      sampleRate: audioContext.sampleRate,
      maxRecordingFrames: audioContext.sampleRate * 10,
      latencySamples: getLatencySamples(
        audioContext.sampleRate,
        stream,
        audioContext
      ),
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
        recording: false,
      })
    }
    if (armed) {
      setRecording(true)
      setArmed(false)
      setRecordButtonColor(red)
      recorderWorklet.current?.port?.postMessage({
        message: 'UPDATE_RECORDING_STATE',
        recording: true,
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
      <button
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
        onClick={toggleMonitoring}
      >
        <Monitor monitorInput={monitorInput} />
      </button>
    </div>
  )
}
