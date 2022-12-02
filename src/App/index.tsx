import React from 'react'
import { AudioProvider } from '../AudioProvider'
import { Clock } from '../Clock'
import { KeyboardProvider } from '../KeyboardProvider'

type Props = {
  stream: MediaStream
  audioContext: AudioContext
}

function App(props: Props) {
  return (
    <KeyboardProvider>
      <AudioProvider stream={props.stream} audioContext={props.audioContext}>
        <Clock />
      </AudioProvider>
    </KeyboardProvider>
  )
}

export default App
