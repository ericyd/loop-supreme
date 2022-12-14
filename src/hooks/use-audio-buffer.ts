import { useMemo } from 'react'

/**
 * This function builds and returns a Float32Array.
 * The data of the array is a quickly decaying sine wave.
 * The Float32Array can be copied to an AudioBuffer for playback.
 * Inspired by https://blog.paul.cx/post/metronome/
 */
function decayingSine(sampleRate: number, frequency: number) {
  const channel = new Float32Array(sampleRate)
  // create a quickly decaying sine wave
  const durationMs = 100
  const durationFrames = sampleRate / (1000 / durationMs)

  // this should always be 1; the output volume can be controlled by a GainNode
  let amplitude = 1
  const amplitudeDecayRate = amplitude / durationFrames

  // this controls how the wave form will be built
  const samplesPerWave = sampleRate / frequency
  const waveDisplacementPerSample = samplesPerWave / 2 / Math.PI

  for (var i = 0; i < durationFrames; i++) {
    channel[i] = Math.sin(i / waveDisplacementPerSample) * amplitude
    amplitude -= amplitudeDecayRate
  }

  return channel
}

export function useSineAudioBuffer(
  audioContext: AudioContext,
  frequency: number
) {
  return useMemo(() => {
    const buffer = audioContext.createBuffer(
      1,
      // this should be the maximum length needed for the audio;
      // since this buffer is just holding a short sine wave, 1 second will be plenty
      audioContext.sampleRate,
      audioContext.sampleRate
    )
    buffer.copyToChannel(decayingSine(buffer.sampleRate, frequency), 0)
    return buffer
  }, [audioContext, frequency])
}
