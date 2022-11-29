/**
 * @license Copyright (c) 2016 Hongchan Choi. MIT License.
 * @fileOverview Canopy PCM wave file exporter.
 *
 * This file has been modified from its original format to fit your screen.
 * Specifically, TS type annotations were added, and the file
 * was converted to a Worker so this could be done off the main thread.
 */

function writeStringToArray(
  value: string,
  targetArray: Uint8Array,
  offset: number
) {
  for (let i = 0; i < value.length; ++i) {
    targetArray[offset + i] = value.charCodeAt(i)
  }
}

function writeInt16ToArray(
  value: number,
  targetArray: Uint8Array,
  offset: number
) {
  value = Math.floor(value)
  targetArray[offset + 0] = value & 255 // byte 1
  targetArray[offset + 1] = (value >> 8) & 255 // byte 2
}

function writeInt32ToArray(
  value: number,
  targetArray: Uint8Array,
  offset: number
) {
  value = Math.floor(value)
  targetArray[offset + 0] = value & 255 // byte 1
  targetArray[offset + 1] = (value >> 8) & 255 // byte 2
  targetArray[offset + 2] = (value >> 16) & 255 // byte 3
  targetArray[offset + 3] = (value >> 24) & 255 // byte 4
}

type Float32 = Float32Array[number]

// Return the bits of the float as a 32-bit integer value.  This
// produces the raw bits; no intepretation of the value is done.
function floatBits(f: Float32) {
  const buf = new ArrayBuffer(4)
  new Float32Array(buf)[0] = f
  const bits = new Uint32Array(buf)[0]
  // Return as a signed integer.
  return bits | 0
}

function writeAudioBufferToArray(
  audioBuffer: AudioBuffer,
  targetArray: Uint8Array,
  offset: number,
  bitDepth: 16 | 32
) {
  let index = 0
  let channel = 0
  const length = audioBuffer.length
  const channels = audioBuffer.numberOfChannels
  let channelData
  let sample

  // Clamping samples onto the 16-bit resolution.
  for (index = 0; index < length; ++index) {
    for (channel = 0; channel < channels; ++channel) {
      channelData = audioBuffer.getChannelData(channel)

      // Branches upon the requested bit depth
      if (bitDepth === 16) {
        sample = channelData[index] * 32768.0
        if (sample < -32768) {
          sample = -32768
        } else if (sample > 32767) {
          sample = 32767
        }
        writeInt16ToArray(sample, targetArray, offset)
        offset += 2
      } else if (bitDepth === 32) {
        // This assumes we're going to out 32-float, not 32-bit linear.
        sample = floatBits(channelData[index])
        writeInt32ToArray(sample, targetArray, offset)
        offset += 4
      } else {
        console.log('Invalid bit depth for PCM encoding.')
        return
      }
    }
  }
}

// 3 means 32-bit float, 1 means integer PCM.
const AudioFormatMap = {
  16: 1,
  32: 3,
}

// to use this blob as a download URL, call
// window.URL.createObjectURL(createWaveFileBlobFromAudioBuffer(audioBuffer, bitsPerSample))
export function createWaveFileBlobFromAudioBuffer(
  audioBuffer: AudioBuffer,
  bitsPerSample: 16 | 32
): Blob {
  // Encoding setup.
  const frameLength = audioBuffer.length
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const bytesPerSample = bitsPerSample / 8
  const byteRate = (sampleRate * numberOfChannels * bitsPerSample) / 8
  const blockAlign = (numberOfChannels * bitsPerSample) / 8
  const wavDataByteLength = frameLength * numberOfChannels * bytesPerSample
  const headerByteLength = 44
  const totalLength = headerByteLength + wavDataByteLength
  const waveFileData = new Uint8Array(totalLength)
  const subChunk1Size = 16
  const subChunk2Size = wavDataByteLength
  const chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size)

  writeStringToArray('RIFF', waveFileData, 0)
  writeInt32ToArray(chunkSize, waveFileData, 4)
  writeStringToArray('WAVE', waveFileData, 8)
  writeStringToArray('fmt ', waveFileData, 12)

  // SubChunk1Size (4)
  writeInt32ToArray(subChunk1Size, waveFileData, 16)
  // AudioFormat (2)
  writeInt16ToArray(AudioFormatMap[bitsPerSample], waveFileData, 20)
  // NumChannels (2)
  writeInt16ToArray(numberOfChannels, waveFileData, 22)
  // SampleRate (4)
  writeInt32ToArray(sampleRate, waveFileData, 24)
  // ByteRate (4)
  writeInt32ToArray(byteRate, waveFileData, 28)
  // BlockAlign (2)
  writeInt16ToArray(blockAlign, waveFileData, 32)
  // BitsPerSample (4)
  writeInt32ToArray(bitsPerSample, waveFileData, 34)
  writeStringToArray('data', waveFileData, 36)
  // SubChunk2Size (4)
  writeInt32ToArray(subChunk2Size, waveFileData, 40)

  // Write actual audio data starting at offset 44.
  writeAudioBufferToArray(audioBuffer, waveFileData, 44, bitsPerSample)

  return new Blob([waveFileData], {
    type: 'audio/wave',
  })
}

/* eslint-disable no-restricted-globals */

type ExportToWaveEvent = {
  message: 'EXPORT_TO_WAV'
  audioBuffer: AudioBuffer
}

self.onmessage = (event: MessageEvent<ExportToWaveEvent>) => {
  if (event.data.message === 'EXPORT_TO_WAV') {
    postMessage({
      message: 'WAV_BLOB',
      blob: createWaveFileBlobFromAudioBuffer(event.data.audioBuffer, 32),
    })
  }
}
