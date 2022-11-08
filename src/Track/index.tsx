import React, { ChangeEventHandler, useState } from 'react'

type Props = {../Metronome
  id: number
  onRemove(): void
}

export const Track: React.FC<Props> = (props) => {
  const [title, setTitle] = useState(`Track ${props.id}`)
  const handleChangeTitle: ChangeEventHandler<HTMLInputElement> = (event) => {
    setTitle(event.target.value)
  }
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
