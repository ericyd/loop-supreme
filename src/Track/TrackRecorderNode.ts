import { logger } from '../util/logger'
import { WaveformWorkerFrameMessage } from '../workers/waveform'

export type RecordingProperties = {
  numberOfChannels: number
  sampleRate: number
  maxRecordingSamples: number
  latencySamples: number
  /**
   * default: false
   */
  monitorInput?: boolean
  bpm: number
  measuresPerLoop: number
  beatsPerMeasure: number
  waveformWorker: Worker
  onRecordingBuffer: (buffer: AudioBuffer) => void
}

type MaxRecordingLengthReachedMessage = {
  message: 'MAX_RECORDING_LENGTH_REACHED'
}

type ShareRecordingBufferMessage = {
  message: 'SHARE_RECORDING_BUFFER'
  channelsData: Array<Float32Array>
  recordingLength: number
  // this allows us to send data through the recorder in messages. Saves an extra ref or piece of state
  forwardData: Record<string, any>
}

type UpdateWaveformMessage = {
  message: 'UPDATE_WAVEFORM'
  gain: number
  samplesPerFrame: number
}

export type RecordingMessage =
  | MaxRecordingLengthReachedMessage
  | ShareRecordingBufferMessage
  | UpdateWaveformMessage

export class TrackRecorderNode extends AudioWorkletNode {
  bpm: number
  measuresPerLoop: number
  beatsPerMeasure: number
  numberOfChannels: number
  latencySamples: number
  audioContext: AudioContext
  waveformWorker: Worker
  onRecordingBuffer: (audioBuffer: AudioBuffer) => void

  constructor(
    audioContext: AudioContext,
    {
      waveformWorker,
      onRecordingBuffer,
      ...processorOptions
    }: RecordingProperties
  ) {
    super(audioContext, 'recorder', { processorOptions })
    logger.debug({ processorOptions })

    this.port.onmessage = (event) => this.onmessage(event.data)
    this.destroy.bind(this)

    this.bpm = processorOptions.bpm
    this.measuresPerLoop = processorOptions.measuresPerLoop
    this.beatsPerMeasure = processorOptions.beatsPerMeasure
    this.audioContext = audioContext
    this.numberOfChannels = processorOptions.numberOfChannels
    this.latencySamples = processorOptions.latencySamples
    this.waveformWorker = waveformWorker
    this.onRecordingBuffer = onRecordingBuffer
  }

  /**
   * Builds a callback that handles the messages from the recorder worker.
   * The most important message to handle is SHARE_RECORDING_BUFFER,
   * which indicates that the recording buffer is ready for playback.
   */
  onmessage(data: RecordingMessage) {
    // If the max length is reached, we can no longer record.
    if (data.message === 'MAX_RECORDING_LENGTH_REACHED') {
      // Not exactly sure what should happen in this case ¯\_(ツ)_/¯
      logger.error(data)
    }

    if (data.message === 'UPDATE_WAVEFORM') {
      this.waveformWorker.postMessage({
        message: 'FRAME',
        gain: data.gain,
        samplesPerFrame: data.samplesPerFrame,
      } as WaveformWorkerFrameMessage)
    }

    if (data.message === 'SHARE_RECORDING_BUFFER') {
      // When in doubt... use dimensional analysis! 🙃 (not clear why the unicode rendering is so different in editor vs online)
      //
      //  60 seconds    beats       60 seconds    minute
      // ———————————— ➗ —————   🟰  ——————————— 𝒙  ———————      =>
      //   minute      minute        minute       beats
      //
      //   seconds    minutes   measures    beats     samples     samples
      //  ————————— 𝒙 ———————— 𝒙 ———————— 𝒙 ———————— 𝒙 ————————— 🟰 ——————————
      //   minute     beat      loop       measure    second       loop
      const targetRecordingLength =
        (60 / this.bpm) *
        this.measuresPerLoop *
        this.beatsPerMeasure *
        this.audioContext.sampleRate

      // create recording buffer with targetRecordingLength,
      // to ensure it matches the loop length precisely.
      const recordingBuffer = this.audioContext.createBuffer(
        this.numberOfChannels,
        targetRecordingLength,
        this.audioContext.sampleRate
      )

      // why does half sound good? No idea!!!
      const latencySamples = this.latencySamples / 2

      for (let i = 0; i < this.numberOfChannels; i++) {
        // The input hardware will have some recording latency.
        // To account for that latency, we shift the input data left by `latencySamples` samples,
        // and add the remainder on to the end of the array. In theory, this will preserve transients that occur right at the beginning of the loop
        const buffer = new Float32Array(targetRecordingLength)
        const firstPart = data.channelsData[i].slice(
          latencySamples,
          targetRecordingLength
        )
        buffer.set(firstPart)
        buffer.set(
          data.channelsData[i].slice(0, latencySamples),
          firstPart.length // length vs byteLength... ?
        )
        recordingBuffer.copyToChannel(
          // copyToChannel accepts an optional 3rd argument, "startInChannel"[1] (or "bufferOffset" depending on your source).
          // which is described as
          //    > An optional offset to copy the data to
          // The way this works is it actually inserts silence at the beginning of the **target channel** for `startInChannel` samples[2].
          // I believe the intended use case is to synchronize audio playback with other media (e.g. video).
          // However, in this case, we are trying to align recorded audio with the start of the loop.
          // In this case we need to **subtract** audio from the buffer, in accordance with the latency of the recording device.
          // [1] https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/copyToChannel
          // [2] https://jsfiddle.net/y7qL9wr4/7
          buffer,
          i,
          0
        )
      }

      this.onRecordingBuffer(recordingBuffer)

      return recordingBuffer
    }
  }

  destroy() {
    this.disconnect()
    this.port.onmessage = null
  }
}
