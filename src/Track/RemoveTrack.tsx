import { useRef, useState } from 'react'
import ButtonBase from '../ButtonBase'
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
    <ButtonBase
      className={confirmRemoval ? 'text-xs bg-red-400 w-full' : 'text-xs'}
      onClick={handleRemove}
      ref={removeButtonRef}
    >
      {confirmRemoval ? <div>Delete track?</div> : <X />}
    </ButtonBase>
  )
}
