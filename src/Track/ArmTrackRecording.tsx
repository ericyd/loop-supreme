type Props = {
  toggleArmRecording(): void
  armed: boolean
  recording: boolean
}

export default function ArmTrackRecording(props: Props) {
  return (
    <button
      className="p-2 border border-zinc-400 border-solid rounded-sm flex-initial mr-2"
      onClick={props.toggleArmRecording}
    >
      <svg
        clipRule="evenodd"
        fillRule="evenodd"
        strokeLinejoin="round"
        strokeMiterlimit="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-6`}
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
    </button>
  )
}
