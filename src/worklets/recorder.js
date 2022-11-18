// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// (mostly) copied wholesale from https://github.com/GoogleChromeLabs/web-audio-samples/blob/eed2a8613af551f2b1d166a01c834e8431fdf3c6/src/audio-worklet/migration/worklet-recorder/recording-processor.js

/**
 * Why JS?
 *    It makes our lives vastly easier
 * The code in this file was heavily inspired by this Google example, and Monica Dinculescu's fantastic metronome test/example code:
 *    https://github.com/GoogleChromeLabs/web-audio-samples/blob/eed2a8613af551f2b1d166a01c834e8431fdf3c6/src/audio-worklet/migration/worklet-recorder/recording-processor.js
 *    https://glitch.com/edit/#!/metronomes?path=worker.js%3A1%3A0
 */
class RecordingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()

    this.sampleRate = options.processorOptions?.sampleRate ?? 0
    this.maxRecordingFrames = options.processorOptions?.maxRecordingFrames ?? 0
    this.numberOfChannels = options.processorOptions?.numberOfChannels ?? 0
    this.latencySamples = options.processorOptions?.latencySamples ?? 0

    this._recordingBuffer = new Array(this.numberOfChannels).fill(
      new Float32Array(this.maxRecordingFrames)
    )

    this.recordedFrames = 0
    this.recording = false

    // We will use a timer to gate our messages; this one will publish at 60hz
    this.framesSinceLastPublish = 0
    this.publishInterval = this.sampleRate / 60

    // We will keep a live sum for rendering the visualizer.
    this.sampleSum = 0

    this.port.onmessage = (event) => {
      if (event.data.message === 'UPDATE_RECORDING_STATE') {
        this.recording = event.data.recording

        if (this.recording === false) {
          this.port.postMessage({
            message: 'SHARE_RECORDING_BUFFER',
            buffer: this._recordingBuffer,
          })
        }
      }
    }
  }

  process(inputs, outputs, params) {
    // I *think* this is required because of a short delay between when the AudioWorkletProcessor is registered, and when the source stream is connected to it
    if (inputs.length === 0 || inputs[0].length === 0) {
      return
    }
    for (let input = 0; input < inputs.length; input++) {
      for (let channel = 0; channel < inputs[input].length; channel++) {
        for (let sample = 0; sample < inputs[input][channel].length; sample++) {
          const currentSample = inputs[input][channel][sample]

          // Copy data to recording buffer.
          if (this.recording) {
            this._recordingBuffer[channel][
              // The input hardware will have some recording latency.
              // To account for that latency, we shift the input data left by `latencySamples` samples.
              // Alternatives:
              //    1. This could be done when copying the buffer to the AudioBuffer channel.
              //       However, to keep everything synchronized (including visuals eventually),
              //       it made sense for the recording processor to automatically account for input latency.
              // See Track.tsx for latency determination
              Math.max(sample + this.recordedFrames - this.latencySamples, 0)
            ] = currentSample
          }

          // Monitor in the input by passing data directly to output, unchanged.
          // The output of the monitor is controlled in the Track via the monitorNode
          outputs[input][channel][sample] = currentSample

          // Sum values for visualizer
          this.sampleSum += currentSample
        }
      }
    }

    const shouldPublish = this.framesSinceLastPublish >= this.publishInterval

    // Validate that recording hasn't reached its limit.
    if (this.recording) {
      if (this.recordedFrames + 128 < this.maxRecordingFrames) {
        this.recordedFrames += 128

        // Post a recording recording length update on the clock's schedule
        if (shouldPublish) {
          this.port.postMessage({
            message: 'UPDATE_RECORDING_LENGTH',
            recordingLength: this.recordedFrames,
          })
        }
      } else {
        // Let the rest of the app know the limit was reached.
        this.recording = false
        this.port.postMessage({
          message: 'MAX_RECORDING_LENGTH_REACHED',
        })

        return false
      }
    }

    // Handle message clock.
    // If we should publish, post message and reset clock.
    if (shouldPublish) {
      this.port.postMessage({
        message: 'UPDATE_VISUALIZERS',
        gain: this.sampleSum / this.framesSinceLastPublish,
      })

      this.framesSinceLastPublish = 0
      this.sampleSum = 0
    } else {
      this.framesSinceLastPublish += 128
    }

    return true
  }
}

registerProcessor('recorder', RecordingProcessor)
