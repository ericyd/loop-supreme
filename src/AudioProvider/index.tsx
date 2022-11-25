/**
 * Exposes AudioContext (the web audio kind, not a React context)
 * and a MediaStream globally.
 * This could probably just be passed as props, but this is marginally more convenient.
 */
import React, { createContext, useContext } from 'react'

type AudioAdapter = {
  audioContext: AudioContext
  stream: MediaStream
}

const AudioRouter = createContext<AudioAdapter | null>(null)

type Props = {
  stream: MediaStream
  audioContext: AudioContext
  children: React.ReactNode
}

export const AudioProvider: React.FC<Props> = ({ children, ...adapter }) => {
  return <AudioRouter.Provider value={adapter}>{children}</AudioRouter.Provider>
}

export function useAudioContext() {
  const audioRouter = useContext(AudioRouter)

  if (audioRouter === null) {
    throw new Error('useAudioContext cannot be used outside of AudioProvider')
  }

  return audioRouter
}
