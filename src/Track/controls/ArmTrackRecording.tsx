import ButtonBase from '../../ButtonBase'

type Props = {
  toggleArmRecording(): void
  armed: boolean
  recording: boolean
}

export function ArmTrackRecording(props: Props) {
  return (
    <ButtonBase onClick={props.toggleArmRecording}>
      <svg
        clipRule="evenodd"
        fillRule="evenodd"
        strokeLinejoin="round"
        strokeMiterlimit="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Arm for recording</title>
        <circle cx="12" cy="12" fillRule="nonzero" r="10" />
        <circle
          cx="12"
          cy="12"
          fillRule="nonzero"
          r="10"
          className={`fill-red-400 ${
            props.armed
              ? 'animate-pulse-custom'
              : props.recording
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        />
      </svg>
    </ButtonBase>
  )
}
