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
import { logger } from '../util/logger'
import { VolumeControl } from './controls/VolumeControl'
import type { ClockControllerMessage } from '../workers/clock'
import type {
  WaveformWorkerMetronomeMessage,
  WaveformWorkerResetMessage,
} from '../workers/waveform'
import { ArmTrackRecording } from './controls/ArmTrackRecording'
import { getLatencySamples } from '../util/get-latency-samples'
import { MonitorInput } from './controls/MonitorInput'
import { Mute } from './controls/Mute'
import { RemoveTrack } from './controls/RemoveTrack'
import { Waveform } from './Waveform'
import { SelectInput } from './controls/SelectInput'
import type {
  ExportWavWorkerEvent,
  WavBlobControllerEvent,
} from '../workers/export'
import { useKeybindings } from '../hooks/use-keybindings'
import { TrackRecorderNode } from './TrackRecorderNode'

type Props = {
  id: number
  onRemove(): void
  clock: Worker
  selected: boolean
  exportTarget: EventTarget
  index: number
  sessionWorklet: AudioWorkletNode
  loopLengthSeconds: number
}

export const Track: React.FC<Props> = ({
  id,
  onRemove,
  clock,
  selected,
  exportTarget,
  index,
  sessionWorklet,
  loopLengthSeconds,
}) => {
  const { audioContext } = useAudioContext()
  // stream is initialized in SelectInput
  const [stream, setStream] = useState<MediaStream | null>(null)

  // title is mostly display-only, but also defines the file name when downloading files
  const [title, setTitle] = useState(`Track ${id}`)
  const handleChangeTitle: ChangeEventHandler<HTMLInputElement> = (event) => {
    setTitle(event.target.value)
  }

  // when a track is armed, it will begin recording automatically on the next loop start
  const [armed, setArmed] = useState(false)
  const toggleArmRecording = () => {
    logger.debug('Toggling arm recording')
    setArmed((value) => !value)
  }
  const [recording, setRecording] = useState(false)

  // delegate waveform generation and wav file writing to workers
  const waveformWorker = useMemo(
    () => new Worker(new URL('../workers/waveform', import.meta.url)),
    []
  )
  const exportWorker = useMemo(
    () => new Worker(new URL('../workers/export', import.meta.url)),
    []
  )
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)

  const titleRef = useRef<HTMLInputElement>(null)
  const rename = useCallback(() => {
    titleRef.current?.select()
  }, [])

  /**
   * Set up track gain.
   * Refs vs State vs Memo:
   * Using a ref is the easiest because if the GainNode were a piece of State or a Memo,
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
   * Connect the monitor and gain nodes to the sessionWorklet.
   * This creates a continuous recording stream into sessionWorklet,
   * so that the live performance can be captured.
   */
  useEffect(() => {
    const gain = gainNode.current
    const monitor = monitorNode.current
    gain.connect(sessionWorklet)
    monitor.connect(sessionWorklet)
    return () => {
      gain.disconnect(sessionWorklet)
      monitor.connect(sessionWorklet)
    }
  }, [sessionWorklet])

  const bufferSource = useRef<AudioBufferSourceNode | null>(null)

  /**
   * When the RecorderNode returns a complete AudioBuffer, assign it to the bufferSource node and connect to the audio graph
   */
  const onRecordingBuffer = useCallback(
    (audioBuffer: AudioBuffer) => {
      bufferSource.current = new AudioBufferSourceNode(audioContext, {
        buffer: audioBuffer,
      })

      gainNode.current.connect(audioContext.destination)
      bufferSource.current.connect(gainNode.current)
      bufferSource.current.start()
    },
    [audioContext]
  )

  /**
   * On mount, create a media stream source from the user's input stream.
   * Initialize the recorder worklet, and connect the audio graph for eventual playback.
   */
  const [recorderWorklet, mediaSource] = useMemo<
    [TrackRecorderNode, MediaStreamAudioSourceNode] | [null, null]
  >(() => {
    if (!stream) {
      return [null, null]
    }
    const mediaSource = audioContext.createMediaStreamSource(stream)
    const worklet = new TrackRecorderNode(audioContext, {
      numberOfChannels: mediaSource.channelCount,
      sampleRate: audioContext.sampleRate,
      // max recording length of 30 seconds. I think that should be sufficient for now?
      maxRecordingSamples: audioContext.sampleRate * 30,
      latencySamples: getLatencySamples(
        audioContext.sampleRate,
        stream,
        audioContext
      ),
      loopLengthSeconds,
      waveformWorker,
      onRecordingBuffer,
    })

    mediaSource
      .connect(worklet)
      .connect(monitorNode.current)
      .connect(audioContext.destination)

    return [worklet, mediaSource]
  }, [
    audioContext,
    onRecordingBuffer,
    waveformWorker,
    stream,
    loopLengthSeconds,
  ])

  /**
   * Stop track playback immediately if track is unmounted
   */
  useEffect(() => {
    return () => {
      bufferSource?.current?.stop()
      bufferSource?.current?.disconnect()
      mediaSource?.disconnect()
    }
  }, [mediaSource])

  const handleLoopstart = useCallback(() => {
    if (recording) {
      setRecording(false)
      recorderWorklet?.port.postMessage({
        message: 'TOGGLE_RECORDING_STATE',
      })
      // for now, assume that track monitoring should end when the loop ends
      setMonitoring(false)
      return
    }
    if (armed) {
      setRecording(true)
      setArmed(false)
      bufferSource.current = null
      recorderWorklet?.port.postMessage({
        message: 'TOGGLE_RECORDING_STATE',
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
      bufferSource.current.start()
    }
  }, [armed, audioContext, recording, recorderWorklet?.port, waveformWorker])

  useEffect(() => {
    function delegateClockMessage(event: MessageEvent<ClockControllerMessage>) {
      if (event.data.loopStart) {
        handleLoopstart()
      } else {
        // keep waveform worker updated to metronome settings
        waveformWorker.postMessage({
          message: 'UPDATE_METRONOME',
          loopLengthSeconds: event.data.loopLengthSeconds,
        } as WaveformWorkerMetronomeMessage)
      }
    }

    clock.addEventListener('message', delegateClockMessage)
    return () => {
      clock.removeEventListener('message', delegateClockMessage)
    }
  }, [handleLoopstart, clock, waveformWorker])

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

  useKeybindings(
    selected
      ? {
          r: { callback: toggleArmRecording },
          i: { callback: toggleMonitoring },
          m: { callback: toggleMuted },
          n: { callback: rename, preventDefault: true },
        }
      : {}
  )

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
            <span className="w-4 h-4 text-xs pl-1 mr-2 rounded-full">
              {index + 1}
            </span>
            <input
              ref={titleRef}
              value={title}
              onChange={handleChangeTitle}
              onFocus={rename}
              className="pl-2 -pr-2 flex-initial mr-2 rounded-full bg-white dark:bg-black"
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
            <SelectInput setStream={setStream} />
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
        href="https://loopsupreme.com"
        className="hidden"
      >
        Download
      </a>
      {/* divider */}
      <div className="border-b border-solid border-light-gray w-full h-2 mb-2" />
    </>
  )
}
