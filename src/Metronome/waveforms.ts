/**
 * This function builds and returns a Float32Array.
 * The data of the array is a quickly decaying sine wave.
 * The Float32Array can be copied to an AudioBuffer for playback.
 * Inspired by https://blog.paul.cx/post/metronome/
 */
export function decayingSine(sampleRate: number, frequency = 300) {
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
