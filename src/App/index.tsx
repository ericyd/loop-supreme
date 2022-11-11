import React from 'react'
import { AudioProvider } from '../AudioRouter'
import { ControlPanel } from '../ControlPanel'
import { MetronomeProvider } from '../Metronome'
import { Scene } from '../Scene'

type Props = {
  stream: MediaStream
}

function App(props: Props) {
  return (
    <AudioProvider stream={props.stream}>
      <MetronomeProvider>
        <ControlPanel />
        <Scene />
      </MetronomeProvider>
    </AudioProvider>
  )
}

export default App
