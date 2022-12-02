/**
 * Tracks are where the magic happens!
 * A Track encapsulates a single audio recording stream,
 * either mono or stereo.
 * Tracks contain controls for recording, monitoring, muting, etc.
 * After recording is complete, the audio buffer loops automatically,
 * a nice feature of the Web Audio API.
 */
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAudioContext } from '../AudioProvider'
import { MetronomeReader } from '../Metronome'
import { logger } from '../util/logger'
import { VolumeControl } from './VolumeControl'
import type { ClockControllerMessage } from '../worklets/clock'
import type {
  WaveformWorkerFrameMessage,
  WaveformWorkerMetronomeMessage,
  WaveformWorkerResetMessage,
} from '../worklets/waveform'
import ArmTrackRecording from './ArmTrackRecording'
import { getLatencySamples } from './get-latency-samples'
import MonitorInput from './MonitorInput'
import Mute from './Mute'
import RemoveTrack from './RemoveTrack'
import Waveform from './Waveform'
import { useKeyboard } from '../KeyboardProvider'
import SelectInput from './SelectInput'
import { deviceIdFromStream } from './device-id-from-stream'
import type {
  ExportWavWorkerEvent,
  WavBlobControllerEvent,
} from '../worklets/export'

type Props = {
  id: number
  onRemove(): void
  metronome: MetronomeReader
  selected: boolean
  exportTarget: EventTarget
}

type RecordingProperties = {
  numberOfChannels: number
  sampleRate: number
  maxRecordingSamples: number
  latencySamples: number
  /**
   * default: false
   */
  monitorInput?: boolean
}

type MaxRecordingLengthReachedMessage = {
  message: 'MAX_RECORDING_LENGTH_REACHED'
}

type ShareRecordingBufferMessage = {
  message: 'SHARE_RECORDING_BUFFER'
  channelsData: Array<Float32Array>
  recordingLength: number
}

type UpdateWaveformMessage = {
  message: 'UPDATE_WAVEFORM'
  gain: number
  samplesPerFrame: number
}

type RecordingMessage =
  | MaxRecordingLengthReachedMessage
  | ShareRecordingBufferMessage
  | UpdateWaveformMessage

export const Track: React.FC<Props> = ({
  id,
  onRemove,
  metronome,
  selected,
  exportTarget,
}) => {
  const { audioContext, stream: defaultStream } = useAudioContext()
  const [stream, setStream] = useState(defaultStream)
  const defaultDeviceId = deviceIdFromStream(defaultStream) ?? ''
  const keyboard = useKeyboard()
  const [title, setTitle] = useState(`Track ${id}`)
  const [armed, setArmed] = useState(false)
  const toggleArmRecording = () => setArmed((value) => !value)
  const [recording, setRecording] = useState(false)
  const waveformWorker = useMemo(
    () => new Worker(new URL('../worklets/waveform', import.meta.url)),
    []
  )
  const exportWorker = useMemo(
    () => new Worker(new URL('../worklets/export', import.meta.url)),
    []
  )
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)

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
      return (event: MessageEvent<RecordingMessage>) => {
        // If the max length is reached, we can no longer record.
        if (event.data.message === 'MAX_RECORDING_LENGTH_REACHED') {
          // TODO: stop recording, or show alert or something
          logger.error(event.data)
        }

        if (event.data.message === 'UPDATE_WAVEFORM') {
          waveformWorker.postMessage({
            message: 'FRAME',
            gain: event.data.gain,
            samplesPerFrame: event.data.samplesPerFrame,
          } as WaveformWorkerFrameMessage)
        }

        if (event.data.message === 'SHARE_RECORDING_BUFFER') {
          const fullRecordingLength = event.data.recordingLength
          // When in doubt... use dimensional analysis! 🙃
          //
          //  60 seconds    beats       60 seconds    minute
          // ———————————— ➗ —————   🟰  ——————————— 𝒙  ———————      =>
          //   minute      minute        minute       beats
          //
          //   seconds    minutes   measures    beats     samples     samples
          //  ————————— 𝒙 ———————— 𝒙 ———————— 𝒙 ———————— 𝒙 ————————— 🟰 ——————————
          //   minute     beat      loop       measure    second       loop
          const targetRecordingLength =
            (60 / metronome.bpm) *
            metronome.measuresPerLoop *
            metronome.timeSignature.beatsPerMeasure *
            audioContext.sampleRate
          logger.debug({
            fullRecordingLength,
            targetRecordingLength,
            differenceInSamples: fullRecordingLength - targetRecordingLength,
            differenceInSeconds:
              (fullRecordingLength - targetRecordingLength) /
              audioContext.sampleRate,
          })

          // create recording buffer with targetRecordingLength,
          // to ensure it matches the loop length precisely.
          const recordingBuffer = audioContext.createBuffer(
            recordingProperties.numberOfChannels,
            targetRecordingLength,
            audioContext.sampleRate
          )

          for (let i = 0; i < recordingProperties.numberOfChannels; i++) {
            // channelsData is an Array of Float32Arrays;
            // each element of Array is a channel, which contain
            // the raw samples for the audio data of that channel
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
              event.data.channelsData[i].slice(0, targetRecordingLength),
              i,
              0
            )
          }

          bufferSource.current = new AudioBufferSourceNode(audioContext, {
            buffer: recordingBuffer,
          })

          gainNode.current.connect(audioContext.destination)
          bufferSource.current.connect(gainNode.current)
          bufferSource.current.start()

          return recordingBuffer
        }
      }
    },
    [
      audioContext,
      waveformWorker,
      metronome.bpm,
      metronome.measuresPerLoop,
      metronome.timeSignature.beatsPerMeasure,
    ]
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
      // max recording length of 30 seconds. I think that should be sufficient for now?
      maxRecordingSamples: audioContext.sampleRate * 30,
      latencySamples: getLatencySamples(
        audioContext.sampleRate,
        stream,
        audioContext
      ),
    }
    logger.debug({ recordingProperties })
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

  /**
   * Update waveform worker when metronome parameters change,
   * so waveforms can be scaled properly
   */
  useEffect(() => {
    waveformWorker.postMessage({
      message: 'UPDATE_METRONOME',
      beatsPerSecond: metronome.bpm / 60,
      measuresPerLoop: metronome.measuresPerLoop,
      beatsPerMeasure: metronome.timeSignature.beatsPerMeasure,
    } as WaveformWorkerMetronomeMessage)
  }, [
    metronome.bpm,
    metronome.measuresPerLoop,
    metronome.timeSignature.beatsPerMeasure,
    waveformWorker,
  ])

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
      return
    }
    if (armed) {
      setRecording(true)
      setArmed(false)
      recorderWorklet.current?.port?.postMessage({
        message: 'UPDATE_RECORDING_STATE',
        recording: true,
      })
      waveformWorker.postMessage({
        message: 'RESET_FRAMES',
      } as WaveformWorkerResetMessage)
      return
    }

    // If source buffer exists, restart the playback.
    // Why not use the `loop` parameter?
    // because any microscopic delta between the clock and the loop length causes drift over time.
    // this is almost certainly imperfect, but at least it will **appear** to be accurate.
    // AudioSourceNodes, including AudioBufferSourceNodes, can only be started once, therefore
    // need to stop, create new, and start again
    if (bufferSource.current?.buffer) {
      bufferSource.current = new AudioBufferSourceNode(audioContext, {
        buffer: bufferSource.current.buffer,
      })
      bufferSource.current.connect(gainNode.current)
      // ramp up to desired gain quickly to avoid clips at the beginning of the loop
      gainNode.current.gain.value = 0.0
      gainNode.current.gain.setTargetAtTime(
        gain,
        audioContext.currentTime,
        0.02
      )
      bufferSource.current.start()
    }
  }

  function delegateClockMessage(event: MessageEvent<ClockControllerMessage>) {
    if (event.data.loopStart) {
      handleLoopstart()
    }
  }

  useEffect(() => {
    metronome.clock.addEventListener('message', delegateClockMessage)
    return () => {
      metronome.clock.removeEventListener('message', delegateClockMessage)
    }
    // TODO: include dependency array so these event listeners aren't added/removed on every render
  })

  /**
   * Attach keyboard listeners.
   * For tracks, these are only applicable when the track is selected
   */
  useEffect(() => {
    logger.debug(`useEffect for track ${id}. Selected: ${selected}`)
    if (selected) {
      keyboard.on('r', `Track ${id}`, toggleArmRecording)
      keyboard.on('i', `Track ${id}`, toggleMonitoring)
      keyboard.on('m', `Track ${id}`, toggleMuted)
    }
    return () => {
      logger.debug(`useEffect cleanup for track ${id}`)
      keyboard.off('r', `Track ${id}`)
      keyboard.off('i', `Track ${id}`)
      keyboard.off('m', `Track ${id}`)
    }
  }, [selected, keyboard, id])

  /**
   * When "export" event is received from the Scene (via exportTarget),
   * post event to exportWorker to generate wave file
   */
  useEffect(() => {
    function postExportToWavMessage() {
      logger.debug(`Posting export message for track ${title}, ID ${id}`)
      if (bufferSource.current?.buffer) {
        // AudioBuffers cannot be copied in a Worker message, so the composite pieces must be sent
        const buffer = bufferSource.current?.buffer
        const channelsData = new Array(buffer.numberOfChannels)
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          channelsData[i] = buffer.getChannelData(i)
        }
        exportWorker.postMessage({
          message: 'EXPORT_TO_WAV',
          audioBufferLength: buffer.length,
          numberOfChannels: buffer.numberOfChannels,
          sampleRate: buffer.sampleRate,
          channelsData,
        } as ExportWavWorkerEvent)
      }
    }

    function handleWavBlob(event: MessageEvent<WavBlobControllerEvent>) {
      logger.debug(`Handling WAV message for track ${title}, ID ${id}`)
      if (event.data.message === 'WAV_BLOB' && downloadLinkRef.current) {
        const url = window.URL.createObjectURL(event.data.blob)
        downloadLinkRef.current.href = url
        downloadLinkRef.current.download = `${title.replace(/\s/g, '-')}.wav`
        downloadLinkRef.current.click()
        window.URL.revokeObjectURL(url)
      }
    }

    exportTarget.addEventListener('export', postExportToWavMessage)
    exportWorker.addEventListener('message', handleWavBlob)
    return () => {
      exportTarget.removeEventListener('export', postExportToWavMessage)
      exportWorker.removeEventListener('message', handleWavBlob)
    }
  }, [exportTarget, exportWorker, title, id])

  return (
    <>
      <div
        className={`flex items-stretch content-center p-2 rounded-md flex-wrap
                  ${selected ? 'shadow-[0_0_0_5px_#528eb0ff]' : ''}`}
      >
        {/* Controls */}
        <div className="flex flex-col">
          {/* Title, Record, Monitor */}
          <div className="flex items-stretch content-center">
            <input
              value={title}
              onChange={handleChangeTitle}
              className="pl-2 -pr-2 flex-initial mr-2 rounded-full"
            />
            <ArmTrackRecording
              toggleArmRecording={toggleArmRecording}
              armed={armed}
              recording={recording}
            />
            <MonitorInput
              toggleMonitoring={toggleMonitoring}
              monitoring={monitoring}
            />
            <Mute onClick={toggleMuted} muted={muted} />
          </div>

          {/* Volume */}
          <div className="w-full">
            <VolumeControl gain={gain} onChange={setGain} />
          </div>

          {/* Remove */}
          <div className="flex items-stretch content-center justify-between">
            <RemoveTrack onRemove={onRemove} />
            <SelectInput
              setStream={setStream}
              defaultDeviceId={defaultDeviceId}
            />
          </div>
        </div>

        {/* Waveform */}
        <div className="grow self-stretch">
          <Waveform
            worker={waveformWorker}
            sampleRate={audioContext.sampleRate}
          />
        </div>
      </div>
      {/* Download element - inspired by this SO answer https://stackoverflow.com/a/19328891/3991555 */}
      <a
        ref={downloadLinkRef}
        href="https://test.example.com"
        className="hidden"
      >
        Download
      </a>
      {/* divider */}
      <div className="border-b border-solid border-zinc-400 w-full h-2 mb-2" />
    </>
  )
}
