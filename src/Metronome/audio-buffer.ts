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

type ClickTrackConfig = {
  loopLengthSeconds: number
  sampleRate: number
  bpm: number
  beatsPerMeasure: number
  measuresPerLoop: number
}

export function generateClickTrack(config: ClickTrackConfig) {
  const buffer = new AudioBuffer({
    length: config.loopLengthSeconds * config.sampleRate,
    numberOfChannels: 1,
    sampleRate: config.sampleRate
  })

  // for each beat in the loop, copy a decaying sine to the correct beat position
  for (let i = 0; i < config.beatsPerMeasure * config.measuresPerLoop; i++) {
    const offset = Math.ceil(i * config.sampleRate * (60 / config.bpm))
    const frequency = i % config.beatsPerMeasure === 0 ? 380 : 330
    buffer.copyToChannel(decayingSine(config.sampleRate, frequency), 0, offset)
  }

  return buffer
}