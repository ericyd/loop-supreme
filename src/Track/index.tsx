import React, { ChangeEventHandler, useEffect, useState } from 'react'
import { useAudioRouter } from '../AudioRouter'
import { Record } from '../icons/Record'
import { X } from '../icons/X'
import { useMetronome } from '../Metronome'

type Props = {
  id: number
  onRemove(): void
}

const red = '#ef4444'
const black = '#000000'

export const Track: React.FC<Props> = (props) => {
  const [metronome] = useMetronome()
  const audioRouter = useAudioRouter()
  const [title, setTitle] = useState(`Track ${props.id}`)
  const [armed, setArmed] = useState(false)
  const [recording, setRecording] = useState(false)
  // TODO: should I be using a tailwind class for this?
  const [recordButtonColor, setRecordButtonColor] = useState(
    recording ? red : black
  )

  const handleChangeTitle: ChangeEventHandler<HTMLInputElement> = (event) => {
    setTitle(event.target.value)
  }

  // if track is armed, toggle the color between red and black every half-beat
  function handleBeat() {
    if (armed) {
      setRecordButtonColor(red)
      setTimeout(() => {
        setRecordButtonColor(black)
      }, (60 / metronome.bpm / 2) * 1000)
    }
  }

  function handleLoopstart() {
    if (recording) {
      setRecording(false)
      audioRouter.recordStop()
    }
    if (armed) {
      audioRouter.recordStart()
      setRecording(true)
      setArmed(false)
      setRecordButtonColor(red)
    }
  }

  useEffect(() => {
    metronome.events.addEventListener('beat', handleBeat)
    metronome.events.addEventListener('loopstart', handleLoopstart)
    return () => {
      metronome.events.removeEventListener('beat', handleBeat)
      metronome.events.removeEventListener('loopstart', handleLoopstart)
    }
  })

  // TODO: need some sort of global lock to prevent recording to multiple tracks at once
  async function handleArmRecording() {
    if (armed) {
      setArmed(false)
      return
    }
    try {
      await audioRouter.getMedia()
      setArmed(true)
    } catch (err) {
      // TODO: better error UX
      console.error(err)
      alert(
        'Unable to get access to a recording device. This app is useless now!'
      )
    }
  }

  return (
    <div className="flex items-start content-center mb-2">
      <input
        value={title}
        onChange={handleChangeTitle}
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
      />
      {/* TODO: make a "confirm" flow so tracks are not accidentally deleted */}
      <button
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
        onClick={props.onRemove}
      >
        <X />
      </button>
      <button
        className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
        onClick={handleArmRecording}
      >
        {/* TODO: two pieces of state for a ... button color????? 🤮🤮🤮 */}
        <Record fill={recording ? red : recordButtonColor} />
      </button>
    </div>
  )
}
