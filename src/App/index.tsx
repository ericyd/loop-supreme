import React from 'react'
import { AudioProvider } from '../AudioRouter'
import { ControlPanel } from '../ControlPanel'
import { MetronomeProvider } from '../Metronome'
import { Scene } from '../Scene'

type Props = {
  stream: MediaStream
  audioContext: AudioContext
}

function App(props: Props) {
  return (
    <AudioProvider stream={props.stream} audioContext={props.audioContext}>
      <MetronomeProvider>
        <ControlPanel />
        <Scene />
      </MetronomeProvider>
    </AudioProvider>
  )
}

export default App
