import ButtonBase from '../ButtonBase'

type Props = {
  onClick(): void
  playing: boolean
}

// from https://iconmonstr.com/media-control-48-svg/
// and https://iconmonstr.com/media-control-49-svg/
export default function PlayPause(props: Props) {
  return (
    <ButtonBase onClick={props.onClick} large>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        {props.playing ? (
          <path d="M11 22h-4v-20h4v20zm6-20h-4v20h4v-20z" />
        ) : (
          <path d="M5 22v-20l18 10-18 10z" />
        )}
      </svg>
    </ButtonBase>
  )
}
