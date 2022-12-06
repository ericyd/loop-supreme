// truly seems like there **must** be a better way...
export function deviceIdFromStream(stream: MediaStream): string | undefined {
  const settingsDeviceId = stream.getAudioTracks()[0].getSettings()?.deviceId
  if (settingsDeviceId) {
    return settingsDeviceId
  }

  const constraintsDeviceId = stream.getAudioTracks()[0].getConstraints()?.deviceId

  if (typeof constraintsDeviceId === 'string') {
    return constraintsDeviceId
  }

  if (Array.isArray(constraintsDeviceId)) {
    return constraintsDeviceId[0]
  }

  if (typeof constraintsDeviceId?.exact === 'string') {
    return constraintsDeviceId.exact
  }

  if (Array.isArray(constraintsDeviceId?.exact)) {
    return constraintsDeviceId?.exact[0]
  }
}
