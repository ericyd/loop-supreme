type Props = {
  onClick(): void
  playing: boolean
}

// from https://iconmonstr.com/media-control-48-svg/
// and https://iconmonstr.com/media-control-49-svg/
export default function PlayPause(props: Props) {
  return (
    <button
      onClick={props.onClick}
      className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        {props.playing ? (
          <path d="M11 22h-4v-20h4v20zm6-20h-4v20h4v-20z" />
        ) : (
          <path d="M3 22v-20l18 10-18 10z" />
        )}
      </svg>
    </button>
  )
}
