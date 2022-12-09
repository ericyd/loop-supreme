import ButtonBase from '../../ButtonBase'

type Props = {
  onClick(): void
  muted: boolean
}

export function Mute(props: Props) {
  return (
    <ButtonBase
      onClick={props.onClick}
      className={props.muted ? 'bg-red-400' : ''}
    >
      <svg version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g aria-label="M">
          <path d="m5.5382 20.822v-16.811h2.7254l3.7777 7.7174 3.7777-7.7444h2.6984v16.838h-2.7254v-11.846l-3.1031 6.2602h-1.5111l-2.9412-6.2333v11.819z" />
        </g>
      </svg>
    </ButtonBase>
  )
}
