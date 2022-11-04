import React from 'react'
import logo from '../icons/iconmonstr-refresh-2.svg'
import { Metronome } from '../Metronome'

function App() {
  return (
    <div className="sm:container mx-auto">
      <h1 className="text-xl">
        <img src={logo} className="App-logo" alt="logo" />
        <p className="font-serif">
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Metronome />
      </h1>
    </div>
  )
}

export default App
