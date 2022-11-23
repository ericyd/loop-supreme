import React from 'react'
import { AudioProvider } from '../AudioProvider'
import { KeyboardProvider } from '../KeyboardProvider'
import { Metronome } from '../Metronome'

type Props = {
  stream: MediaStream
  audioContext: AudioContext
}

function App(props: Props) {
  return (
    <KeyboardProvider>
      <AudioProvider stream={props.stream} audioContext={props.audioContext}>
        <Metronome />
      </AudioProvider>
    </KeyboardProvider>
  )
}

export default App
