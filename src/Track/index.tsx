import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAudioRouter } from '../AudioRouter'
import { MetronomeReader } from '../Metronome'
import { logger } from '../util/logger'
import { VolumeControl } from '../VolumeControl'
import { ClockConsumerMessage } from '../worklets/ClockWorker'
import ArmTrackRecording from './ArmTrackRecording'
import { getLatencySamples } from './get-latency-samples'
import MonitorInput from './MonitorInput'
import RemoveTrack from './RemoveTrack'

type Props = {
  id: number
  onRemove(): void
  metronome: MetronomeReader
}

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
  const toggleArmRecording = () => setArmed((value) => !value)
  const [recording, setRecording] = useState(false)

  /**
   * Set up track gain.
   * Refs vs State ... still learning.
   * I believe this is correct because if the GainNode were a piece of State,
   * then the GainNode would be re-instantiated every time the gain changed.
   * That would destroy the audio graph that gets connected when the track is playing back.
   * The audio graph should stay intact, so mutating the gain value directly is (I believe) the correct way to achieve this.
   */
  const [gain, setGain] = useState(1)
  const [muted, setMuted] = useState(false)
  const toggleMuted = () => setMuted((value) => !value)
  const gainNode = useRef(new GainNode(audioContext, { gain }))
  useEffect(() => {
    gainNode.current.gain.value = muted ? 0.0 : gain
  }, [gain, muted])

  /**
   * Set up track monitoring
   */
  const [monitoring, setMonitoring] = useState(false)
  const toggleMonitoring = () => setMonitoring((value) => !value)
  const monitorNode = useRef(
    new GainNode(audioContext, { gain: monitoring ? 1.0 : 0.0 })
  )
  useEffect(() => {
    monitorNode.current.gain.setTargetAtTime(
      monitoring ? 1.0 : 0.0,
      audioContext.currentTime,
      0.1
    )
  }, [monitoring, audioContext])

  /**
   * Both of these are instantiated on mount
   */
  const recorderWorklet = useRef<AudioWorkletNode>()
  const bufferSource = useRef<AudioBufferSourceNode>()

  /**
   * Builds a callback that handles the messages from the recorder worklet.
   * The most important message to handle is SHARE_RECORDING_BUFFER,
   * which indicates that the recording buffer is ready for playback.
   */
  const buildRecorderMessageHandler = useCallback(
    (recordingProperties: RecordingProperties) => {
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
            // TODO: I'm also not sure if constructing the audioBuffer from the "recordingLength" indicated from the worklet is the best way.
            // Shouldn't we set it equal to the expected length of the recording based on the BPM and measure count?
            // And if the recording is longer, we trim it; if it is shorter, we pad right with silence (which might be default behavior anyway)
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

          bufferSource.current = new AudioBufferSourceNode(audioContext, {
            buffer: recordingBuffer,
            loop: true,
          })

          gainNode.current.connect(audioContext.destination)
          bufferSource.current.connect(gainNode.current)
          bufferSource.current.start()

          return recordingBuffer
        }
      }
    },
    [audioContext]
  )

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

    // Wanna have your mind blown?
    // Adding an event listener to this port with `addEventListener` simply doesn't work!
    // go ahead and try it:
    // recorderWorklet.current.port.addEventListener('message', console.log.bind(console))
    recorderWorklet.current.port.onmessage =
      buildRecorderMessageHandler(recordingProperties)

    mediaSource
      .connect(recorderWorklet.current)
      .connect(monitorNode.current)
      .connect(audioContext.destination)

    return () => {
      if (recorderWorklet.current) {
        recorderWorklet.current.disconnect()
        recorderWorklet.current.port.onmessage = null
        recorderWorklet.current = undefined
      }
      bufferSource.current?.stop()
      mediaSource.disconnect()
    }
  }, [audioContext, buildRecorderMessageHandler, stream])

  const handleChangeTitle: ChangeEventHandler<HTMLInputElement> = (event) => {
    setTitle(event.target.value)
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
      recorderWorklet.current?.port?.postMessage({
        message: 'UPDATE_RECORDING_STATE',
        recording: true,
      })
    }
  }

  function delegateClockMessage(event: MessageEvent<ClockConsumerMessage>) {
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

  return (
    <div className="flex items-start content-center mb-2 pb-2 border-b border-solid border-zinc-400">
      {/* Controls */}
      <div className="flex flex-col">
        {/* Title */}
        <input
          value={title}
          onChange={handleChangeTitle}
          className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2 mb-2"
        />

        {/* Record, Monitor */}
        <div className="flex items-start content-center mb-2">
          <ArmTrackRecording
            toggleArmRecording={toggleArmRecording}
            armed={armed}
            recording={recording}
          />
          <MonitorInput
            toggleMonitoring={toggleMonitoring}
            monitoring={monitoring}
          />
        </div>

        {/* Volume */}
        <div className="mb-2">
          <VolumeControl
            muted={muted}
            toggleMuted={toggleMuted}
            gain={gain}
            onChange={setGain}
          />
        </div>

        {/* Remove */}
        <div>
          <RemoveTrack onRemove={onRemove} />
        </div>
      </div>

      {/* Waveform */}
      <div className="p-2 border border-zinc-400 border-solid rounded-sm">
        This is where the waveform will go
      </div>
    </div>
  )
}
