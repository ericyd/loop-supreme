import React from 'react'
import { AudioProvider } from '../AudioRouter'
import { Metronome } from '../Metronome'

type Props = {
  stream: MediaStream
  audioContext: AudioContext
}

function App(props: Props) {
  return (
    <AudioProvider stream={props.stream} audioContext={props.audioContext}>
      <Metronome />
    </AudioProvider>
  )
}

export default App
