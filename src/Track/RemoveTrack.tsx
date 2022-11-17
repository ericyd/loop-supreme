import { useRef, useState } from 'react'
import { X } from '../icons/X'

type Props = {
  onRemove(): void
}

export default function RemoveTrack(props: Props) {
  const removeButtonRef = useRef<HTMLButtonElement>(null)
  const [attemptingRemoval, setAttemptingRemoval] = useState(false)
  function handleRemove() {
    if (attemptingRemoval) {
      props.onRemove()
    }

    setAttemptingRemoval(true)
    removeButtonRef.current?.addEventListener('blur', () => {
      setAttemptingRemoval(false)
    })
  }

  return (
    <button
      className={`p-2 border border-zinc-400 border-solid rounded-sm flex-shrink mr-2 ${
        attemptingRemoval && 'bg-red-400'
      }`}
      onClick={handleRemove}
      ref={removeButtonRef}
    >
      {attemptingRemoval ? 'Delete track?' : <X />}
    </button>
  )
}
