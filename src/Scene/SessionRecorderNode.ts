// maybe not the most elegant to import from here, but since they share the underlying worklet, the message types are the same
import type { RecordingMessage } from '../Track/TrackRecorderNode'
import { logger } from '../util/logger'
import type { ExportWavWorkerEvent } from '../workers/export'

type RecordingProperties = {
  numberOfChannels: number
  sampleRate: number
  maxRecordingSamples: number
  /**
   * default: false
   */
  monitorInput?: boolean
  exportWorker: Worker
}

export class SessionRecorderNode extends AudioWorkletNode {
  numberOfChannels: number
  audioContext: AudioContext
  exportWorker: Worker

  constructor(
    audioContext: AudioContext,
    {
      exportWorker,
      ...processorOptions
    }: RecordingProperties
  ) {
    super(audioContext, 'recorder', { processorOptions })
    logger.debug({ processorOptions })

    this.port.onmessage = (event) => this.onmessage(event.data)
    this.destroy.bind(this)

    this.audioContext = audioContext
    this.numberOfChannels = processorOptions.numberOfChannels
    this.exportWorker = exportWorker
  }

  /**
   * Builds a callback that handles the messages from the recorder worker.
   * The most important message to handle is SHARE_RECORDING_BUFFER,
   * which indicates that the recording buffer is ready for playback.
   */
  onmessage(data: RecordingMessage) {
    if (data.message === 'MAX_RECORDING_LENGTH_REACHED') {
      // Not exactly sure what should happen in this case ¯\_(ツ)_/¯
      alert(
        "You recorded more than 500 seconds. That isn't allowed. Not sure why though, maybe it can record indefinitely?"
      )
      logger.error(data)
    }

    // See Track/index.tsx for detailed notes on the functionality here
    if (data.message === 'SHARE_RECORDING_BUFFER') {
      // this data is passed to the recorder worklet in `toggleRecording` function
      const recordingDurationSeconds =
        data.forwardData.recordingDurationSeconds
      const recordingDurationSamples = Math.ceil(
        this.audioContext.sampleRate * recordingDurationSeconds
      )
      logger.debug({
        recordingDurationSamples,
        recordingDurationSeconds,
        'data.channelsData[0].length':
          data.channelsData[0].length,
      })

      logger.debug(`Posting export message for scene performance`)
      this.exportWorker.postMessage({
        message: 'EXPORT_TO_WAV',
        audioBufferLength: recordingDurationSamples,
        numberOfChannels: this.numberOfChannels,
        sampleRate: this.audioContext.sampleRate,
        channelsData: data.channelsData.map((data) =>
          data.slice(0, recordingDurationSamples)
        ),
      } as ExportWavWorkerEvent)
    }
  }

  destroy() {
    this.disconnect()
    this.port.onmessage = null
  }
}
