import React from 'react'

type Props = {
  onClick: React.MouseEventHandler<HTMLButtonElement>
  children: React.ReactNode
  className?: string
  large?: boolean
  wide?: boolean
}

const Large = {
  border: 'border-4',
  width: 'w-16',
  height: 'h-16',
  padding: 'p-3',
}

const Small = {
  border: 'border-2',
  width: 'w-7',
  height: 'h-7',
  padding: 'p-1',
}

const Wide = {
  width: 'w-full',
}

const Regular = {
  width: null,
}

function ButtonBase(
  props: Props,
  forwardRef: React.ForwardedRef<HTMLButtonElement>
) {
  // This feels sooooooo overkill.
  // The single edge case I was trying to account for was the RemoveTrack button,
  // which swaps the content from an icon to some text on click.
  // The Tailwind `w-full` style gets overridden by the `w-7` style, so it doesn't work to include both.
  // This was a way to allow setting complex width/height/padding/border properties with as few component props as possible.
  // Is this the correct optimization to make? Who knows!
  const width = props.wide ? Wide : Regular
  const size = props.large ? Large : Small
  const h = size.height
  const w = width.width ?? size.width
  const p = size.padding
  const b = size.border
  return (
    <button
      onClick={props.onClick}
      className={`border-black border-solid rounded-full flex-initial mr-2
                  dark:border-white dark:fill-white
                  hover:shadow-button focus:shadow-button
                  ${h} ${w} ${p} ${b} ${props.className ?? ''}`}
      ref={forwardRef}
    >
      {props.children}
    </button>
  )
}

export default React.forwardRef(ButtonBase)
