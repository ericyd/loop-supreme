/**
 * Why JS?
 *    It makes our lives vastly easier. See scripts/postbuild.sh for more insight.
 * What does this file do?
 *    It defines an AudioWorkletProcess (much like a Worker) which processes audio data input
 *    and saves it to a buffer which can be used to play back the audio.
 *    Although the functionality here is fairly simple, this frees up a lot of
 *    processing power since AudioWorkletProcessors don't run on the main thread.
 * The code in this file was heavily inspired by (and lifted from) this Google example:
 *    https://github.com/GoogleChromeLabs/web-audio-samples/blob/eed2a8613af551f2b1d166a01c834e8431fdf3c6/src/audio-worklet/migration/worklet-recorder/recording-processor.js
 */

/**
 * @typedef Channel
 * @type {Float32Array}
 */

/**
 * @typedef Input
 * @type {Channel[]}
 */

/**
 * @typedef Output
 * @type {Channel[]}
 */

// from https://github.com/microsoft/TypeScript/blob/d8aced98d9f68d5f036edba18075ac453432a4a2/lib/lib.dom.d.ts#L129-L135
/**
 * @typedef AudioWorkletNodeOptions
 * @type {object}
 * @property {number} numberOfInputs
 * @property {number} numberOfOutputs
 * @property {number[]} outputChannelCount
 * @property {Record<string, number>} parameterData
 * @property {any} processorOptions
 */

class RecordingProcessor extends AudioWorkletProcessor {
  /**
   * @param {AudioWorkletNodeOptions} options
   */
  constructor(options) {
    super()

    this.sampleRate = options.processorOptions?.sampleRate ?? 0
    this.maxRecordingFrames = options.processorOptions?.maxRecordingFrames ?? 0
    this.numberOfChannels = options.processorOptions?.numberOfChannels ?? 0
    this.latencySamples = options.processorOptions?.latencySamples ?? 0

    this.channelsData = new Array(this.numberOfChannels).fill(
      new Float32Array(this.maxRecordingFrames)
    )

    // recordedFrames is incremented by the blockSize when input blocks are processed.
    // Since Float32Arrays must be initialized with a known length,
    // this mutable property keeps track of how much we've processed, so we don't try to overflow the buffer
    this.recordedFrames = 0

    // Simple boolean to indicate whether or not we are currently recording.
    // Even when this is false, we still process the input -> output in case
    // the input is being monitored.
    this.recording = false

    // Sending "update" messages every time the processor receives a block would be too frequent.
    // We can gate the messages by number of blocks processed to reduce processing demand on the app listeners.
    this.samplesSinceLastPublish = 0
    const publishingCadenceHz = 60
    this.targetSamplesPerFrame = this.sampleRate / publishingCadenceHz

    // The sample sum is the sum of the gain of each sample, for a given message.
    // This gets averaged over the number of samples in the message when published back to the app.
    // This provides a reasonable approximation of "gain" for a single message,
    // which can be used to update the waveform visualizer.
    this.sampleSum = 0

    // Consider defining a typedef for MessagePort, to constrain the types of messages it will send/receive
    // From https://github.com/microsoft/TypeScript-DOM-lib-generator/blob/b929eb7863a3bf73f4a887fb97063276b10b92bc/baselines/audioworklet.generated.d.ts#L463-L482
    this.port.onmessage = (event) => {
      if (event.data.message === 'UPDATE_RECORDING_STATE') {
        this.recording = event.data.recording

        // When the recording ends, send the buffer back to the Track
        if (this.recording === false) {
          this.port.postMessage({
            message: 'SHARE_RECORDING_BUFFER',
            channelsData: this.channelsData,
            recordingLength: this.recordedFrames,
          })
        }
      }
    }
  }

  /**
   *
   * @param {Input[]} inputs
   * @param {Output[]} outputs
   * @param {Record<string, Float32Array>} params
   * @returns boolean "Returning true forces the Web Audio API to keep the node alive,
   *                   while returning false allows the browser to terminate the node if
   *                   it is neither generating new audio data nor receiving data through
   *                   its inputs that it is processing" - MDN
   */
  process(inputs, outputs) {
    // I *think* this is required because of a short delay between when the AudioWorkletProcessor is registered, and when the source stream is connected to it
    if (inputs.length === 0 || inputs[0].length === 0) {
      return true
    }

    const blockSize = this.handleInput(inputs, outputs)
    const shouldPublish =
      this.samplesSinceLastPublish >= this.targetSamplesPerFrame

    // Returned in a chain because `process` must return a boolean.
    // If any method returns false, the downstream methods should not be called.
    return (
      this.handleMaxRecordingLength(blockSize) &&
      this.incrementRecordedFrames(blockSize) &&
      this.updateWaveform(shouldPublish, blockSize)
    )
  }

  /**
   * Processes input;
   * Passes directly to output, for monitoring,
   * and pushes to recording buffer if worklet is currently recording
   *
   *
   * Note: Currently, audio data blocks are always 128 frames long—that is,
   * they contain 128 32-bit floating-point samples for each of the inputs' channels.
   * However, plans are already in place to revise the specification to allow
   * the size of the audio blocks to be changed depending on circumstances
   * (for example, if the audio hardware or CPU utilization is more efficient with larger block sizes).
   * Therefore, you must always check the size of the sample array rather than assuming a particular size.
   * This size may even be allowed to change over time, so you mustn't look at just the first block
   * and assume the sample buffers will always be the same size.
   *  - https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
   *
   *
   * @param {Input[]} inputs
   * @param {Output[]} outputs
   * @returns number block size
   */
  handleInput(inputs, outputs) {
    const channelSampleLengths = []
    for (let input = 0; input < inputs.length; input++) {
      for (let channel = 0; channel < inputs[input].length; channel++) {
        channelSampleLengths.push(inputs[input][channel].length)
        for (let sample = 0; sample < inputs[input][channel].length; sample++) {
          const currentSample = inputs[input][channel][sample]

          // Copy data to recording buffer.
          if (this.recording) {
            this.channelsData[channel][
              // The input hardware will have some recording latency.
              // To account for that latency, we shift the input data left by `latencySamples` samples.
              // Alternatives:
              //    1. This could be done when copying the buffer to the AudioBuffer channel.
              //       However, to keep everything synchronized (including visuals eventually),
              //       it made sense for the recording processor to automatically account for input latency.
              // See Track.tsx for latency determination
              Math.max(sample + this.recordedFrames - this.latencySamples, 0)
            ] = currentSample

            // Sum values for visualizer
            this.sampleSum += currentSample
          }

          // Monitor in the input by passing data directly to output, unchanged.
          // The output of the monitor is controlled in the Track via the monitorNode
          outputs[input][channel][sample] = currentSample
        }
      }
    }
    // I assume that the block sizes for each channel would never be different, though who knows!
    return Math.max(...channelSampleLengths)
  }

  /**
   * Validate that recording hasn't reached its limit.
   * If it has, broadcast to the rest of the app.
   * @param {number} blockSize
   * @returns boolean
   */
  handleMaxRecordingLength(blockSize) {
    if (
      this.recording &&
      this.recordedFrames + blockSize >= this.maxRecordingFrames
    ) {
      this.recording = false
      this.port.postMessage({
        message: 'MAX_RECORDING_LENGTH_REACHED',
      })

      return false
    }
    return true
  }

  /**
   * Increment the count of recorded frames, if it hasn't exceeded the max
   * @param {boolean} shouldPublish
   * @param {number} blockSize
   * @returns boolean
   */
  incrementRecordedFrames(blockSize) {
    if (
      this.recording &&
      this.recordedFrames + blockSize < this.maxRecordingFrames
    ) {
      this.recordedFrames += blockSize
    }
    return true
  }

  /**
   * If the processor should publish,
   * publish message with average sample gain and reset the publish interval.
   * Else, increment the frames since last publish
   * @param {boolean} shouldPublish
   * @param {number} blockSize
   * @returns boolean
   */
  updateWaveform(shouldPublish, blockSize) {
    if (!this.recording) {
      return true
    }
    if (shouldPublish) {
      this.port.postMessage({
        message: 'UPDATE_WAVEFORM',
        gain: this.sampleSum / this.samplesSinceLastPublish,
        // if samplesPerFrame is not evenly divisible by blockSize, then
        // the actual samplesPerFrame will be higher than the calculated value in this.targetSamplesPerFrame
        samplesPerFrame:
          Math.ceil(this.targetSamplesPerFrame / blockSize) * blockSize,
      })

      this.samplesSinceLastPublish = 0
      this.sampleSum = 0
    }
    // A block was still processed; this should be incremented regardless
    // I think this source is incorrect: https://github.com/GoogleChromeLabs/web-audio-samples/blob/eed2a8613af551f2b1d166a01c834e8431fdf3c6/src/audio-worklet/migration/worklet-recorder/recording-processor.js#L108-L110
    this.samplesSinceLastPublish += blockSize
    return true
  }
}

registerProcessor('recorder', RecordingProcessor)
