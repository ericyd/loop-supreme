import React from 'react'
import logo from './iconmonstr-refresh-2.svg'

function App() {
  return (
    <div className="sm:container mx-auto">
      <h1 className="text-xl">
        <img src={logo} className="App-logo" alt="logo" />
        <p className="font-serif">
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </h1>
    </div>
  )
}

export default App
