import { useRef, useState } from 'react'
import { X } from '../icons/X'

type Props = {
  onRemove(): void
}

export default function RemoveTrack(props: Props) {
  const removeButtonRef = useRef<HTMLButtonElement>(null)
  const [confirmRemoval, setConfirmRemoval] = useState(false)
  function handleRemove() {
    if (confirmRemoval) {
      props.onRemove()
    }

    setConfirmRemoval(true)
    removeButtonRef.current?.addEventListener('blur', () => {
      setConfirmRemoval(false)
    })
  }

  return (
    <button
      className={`p-2 border border-zinc-400 border-solid rounded-sm flex-shrink mr-2 ${
        confirmRemoval && 'bg-red-400'
      }`}
      onClick={handleRemove}
      ref={removeButtonRef}
    >
      {confirmRemoval ? 'Delete track?' : <X />}
    </button>
  )
}
