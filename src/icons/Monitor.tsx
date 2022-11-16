type Props = {
  monitorInput: boolean
}

// from https://iconmonstr.com/headphones-8-svg/
export const Monitor: React.FC<Props> = (props) => {
  const zigZagPath =
    'm-1.151 16.712l.786-4.788.803 3.446c.079.353.569.393.703.053l.727-1.858.678 1.582c.113.262.468.303.637.072l.618-.84h1.199v-.737h-1.391c-.117 0-.229.056-.298.151l-.342.469-.779-1.813c-.13-.303-.562-.296-.683.011l-.616 1.576-.95-4.208c-.09-.398-.659-.375-.724.022l-.788 4.86-.805-2.993c-.09-.357-.595-.377-.709-.023l-.598 1.948h-1.317v.737h1.607c.133 0 .278-.108.315-.235l.298-1.008.906 3.607c.099.389.659.363.723-.031z'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={props.monitorInput ? 'fill-orange-400' : ''}
    >
      <path
        d={`M6 23v-11c-4.036 0-6 2.715-6 5.5 0 2.807 1.995 5.5 6 5.5z
            m18-5.5c0-2.785-1.964-5.5-6-5.5v11c4.005 0 6-2.693 6-5.5z
            m-12-13.522c-3.879-.008-6.861 2.349-7.743 6.195-.751.145-1.479.385-2.161.716.629-5.501 4.319-9.889 9.904-9.889 5.589 0 9.29 4.389 9.916 9.896-.684-.334-1.415-.575-2.169-.721-.881-3.85-3.867-6.205-7.747-6.197z
            ${props.monitorInput ? zigZagPath : ''}`}
      />
    </svg>
  )
}
