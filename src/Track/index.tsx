import React, { ChangeEventHandler, useState } from 'react'

type Props = {
  id: number
  onRemove(): void
}

const red = '#ef4444'
const black = '#000000'

export const Track: React.FC<Props> = (props) => {
  const [metronome] = useMetronome()
  const [title, setTitle] = useState(`Track ${props.id}`)
  const [armed, setArmed] = useState(false)
  const [recording, setRecording] = useState(false)
  const [audioData, setAudioData] = useState<Blob[]>([])
  // TODO: should I be using a tailwind class for this?
  const [recordButtonColor, setRecordButtonColor] = useState(
    recording ? red : black
  )

  const audioRouter = useAudioRouter()

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
    // TODO
  }

  useEffect(() => {
    metronome.events.addEventListener('beat', handleBeat)
    metronome.events.addEventListener('loopstart', handleLoopstart)
    return () => {
      metronome.events.removeEventListener('beat', handleBeat)
      metronome.events.removeEventListener('loopstart', handleLoopstart)
    }
  })
  return (
    <div>
      <input value={title} onChange={handleChangeTitle} />
      <button
        className="p-2 border border-zinc-400 border-solid rounded-sm"
        onClick={props.onRemove}
      >
        Remove
      </button>
    </div>
  )
}
