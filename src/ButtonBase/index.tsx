import React from 'react'

type Props = {
  onClick: React.MouseEventHandler<HTMLButtonElement>
  children: React.ReactNode
  className?: string
  large?: boolean
}

function ButtonBase(
  props: Props,
  forwardRef: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      onClick={props.onClick}
      className={`border border-zinc-400 border-solid rounded-full flex-initial mr-2 ${
        props.large ? 'w-16 h-16 p-3' : 'w-6 h-6 p-1'
      } ${props.className ?? ''}`}
      ref={forwardRef}
    >
      {props.children}
    </button>
  )
}

export default React.forwardRef(ButtonBase)
