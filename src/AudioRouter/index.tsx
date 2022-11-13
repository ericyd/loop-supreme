/**
 * AudioContext is already a global that is used extensively in this app.
 * Although this is a "React Context", it seemed more important to avoid naming collisions,
 * hence "AudioRouter"
 *
 * TODO: should this context be removed and values just be passed around as props?
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

export function useAudioRouter() {
  const audioRouter = useContext(AudioRouter)

  if (audioRouter === null) {
    throw new Error('useAudioRouter cannot be used outside of AudioProvider')
  }

  return audioRouter
}
