import { logger } from '../util/logger'

/**
 *
 * @param sampleRate
 * @param stream
 * @param audioContext
 * @returns
 */
export function getLatencySamples(
  sampleRate: number,
  stream: MediaStream,
  audioContext: AudioContext
): number {
  // This check is duplicated in Start/index.tsx but it is fine to re-check here
  const supportedConstraints = navigator.mediaDevices.getSupportedConstraints()
  // @ts-expect-error This is a documented property, and indeed it is `true` in Chrome https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSupportedConstraints/latency
  if (!supportedConstraints.latency) {
    logger.log({
      message:
        'Could not get track latency because this environment does not report latency on MediaStreamTracks',
      supportedConstraints,
    })
    return 0
  }
  const recordingStreamLatencies = stream.getAudioTracks().map((channel, i) => {
    // In Chrome, this is the best (only?) way to get the track latency
    // Strangely, it isn't even documented on MDN https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities
    const capabilitiesLatency =
      typeof channel.getCapabilities === 'function' &&
      channel.getCapabilities?.()?.latency?.max
    if (typeof capabilitiesLatency === 'number') {
      return capabilitiesLatency
    }
    logger.debug({
      message: 'Could not get capabilities, or latency was not a number',
      channel: i,
      typeofGetCapabilities: typeof channel.getCapabilities,
      capabilitiesLatency,
    })

    // this should be an alternative, but doesn't appear to be populated in Firefox https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/latency
    const constraintLatency =
      typeof channel.getConstraints === 'function' &&
      channel.getConstraints?.()?.latency
    if (typeof constraintLatency === 'number') {
      return constraintLatency
    }
    logger.debug({
      message: 'Could not get constraints, or latency was not a number',
      channel: i,
      typeofGetConstraints: typeof channel.getConstraints,
      constraintLatency,
    })

    // this is yet another alternative according to MDN but not implemented in major browsers yet https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/latency
    // Just leaving as a fall back in case browsers implement in the future
    const settingsLatency =
      typeof channel.getSettings === 'function' &&
      // @ts-expect-error lib.dom.d.ts doesn't believe this is a valid option (which I suppose is technically true)
      channel.getSettings?.()?.latency
    if (typeof settingsLatency === 'number') {
      return settingsLatency
    }
    logger.debug({
      message: 'Could not get settings, or latency was not a number',
      channel: i,
      typeofGetSettings: typeof channel.getSettings,
      settingsLatency,
    })

    return 0
  })

  const latencySeconds = Math.max(
    audioContext.baseLatency,
    audioContext.outputLatency,
    ...recordingStreamLatencies
  )
  logger.debug({
    'audioContext.baseLatency': audioContext.baseLatency,
    'audioContext.outputLatency': audioContext.outputLatency,
    recordingStreamLatencies,
    latencySeconds,
  })
  return Math.ceil(latencySeconds * sampleRate)
}
