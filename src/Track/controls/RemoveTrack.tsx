import { useRef, useState } from 'react'
import ButtonBase from '../../ButtonBase'
import { X } from '../../icons/X'

type Props = {
  onRemove(): void
}

export function RemoveTrack(props: Props) {
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
      className={confirmRemoval ? 'bg-red' : ''}
      wide={confirmRemoval}
      onClick={handleRemove}
      ref={removeButtonRef}
    >
      {confirmRemoval ? (
        <div className="text-xs dark:text-black">Delete?</div>
      ) : (
        <X />
      )}
    </ButtonBase>
  )
}
