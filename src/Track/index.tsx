import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react'
import { useAudioRouter } from '../AudioRouter'
import { Record } from '../icons/Record'
import { X } from '../icons/X'
import { MetronomeReader } from '../Metronome'
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
  const audioRouter = useAudioRouter()
  const [title, setTitle] = useState(`Track ${id}`)
  const [armed, setArmed] = useState(false)
  const [recording, setRecording] = useState(false)
  // TODO: should I be using a tailwind class for this?
  const [recordButtonColor, setRecordButtonColor] = useState(
    recording ? red : black
  )

  const recorderWorklet = useRef<AudioWorkletNode>()
  useEffect(() => {
    const mediaSource = audioRouter.audioContext.createMediaStreamSource(
      audioRouter.stream
    )
    const recordingProperties: RecordingProperties = {
      numberOfChannels: mediaSource.channelCount,
      sampleRate: audioRouter.audioContext.sampleRate,
      maxFrameCount: audioRouter.audioContext.sampleRate * 10,
    }
    recorderWorklet.current = new AudioWorkletNode(
      audioRouter.audioContext,
      'recorder',
      {
        processorOptions: recordingProperties,
      }
    )

    const monitorNode = audioRouter.audioContext.createGain()

    // We can pass this port across the app
    // and let components handle their relevant messages
    // TODO: this ^ is probably the way to handle the clock. Then I can add event listeners everywhere
    const recordingCallback = handleRecording(recordingProperties)

    // setupMonitor(monitorNode);

    recorderWorklet.current.port.onmessage = async (event) => {
      if (event.data.message === 'UPDATE_VISUALIZERS') {
        // visualizerCallback(event);
      } else {
        await recordingCallback(event)
      }
    }

    mediaSource
      .connect(recorderWorklet.current)
      .connect(monitorNode)
      .connect(audioRouter.audioContext.destination)
  }, [])

  function handleRecording(recordingProperties: RecordingProperties) {
    let recordingLength = 0

    // If the max length is reached, we can no longer record.
    return async (event: MessageEvent<RecordingMessage>) => {
      if (event.data.message === 'MAX_RECORDING_LENGTH_REACHED') {
        // isRecording = false;
      }
      if (event.data.message === 'UPDATE_RECORDING_LENGTH') {
        recordingLength = event.data.recordingLength
      }
      if (event.data.message === 'SHARE_RECORDING_BUFFER') {
        const recordingBuffer = audioRouter.audioContext.createBuffer(
          recordingProperties.numberOfChannels,
          recordingLength,
          audioRouter.audioContext.sampleRate
        )

        // TODO: trim to loop length?
        for (let i = 0; i < recordingProperties.numberOfChannels; i++) {
          recordingBuffer.copyToChannel(event.data.buffer[i], i, 0)
        }

        console.log({ recordingBuffer })

        const bufferSource = new AudioBufferSourceNode(
          audioRouter.audioContext,
          {
            buffer: recordingBuffer,
            loop: true,
          }
        )

        // Volume control for track playback
        const gain = new GainNode(audioRouter.audioContext, {
          // must be in range [0.0, 1.0]
          gain: 0.99,
        })
        gain.connect(audioRouter.audioContext.destination)
        bufferSource.connect(gain)
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
    </div>
  )
}
