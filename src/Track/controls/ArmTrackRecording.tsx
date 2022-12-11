import ButtonBase from '../../ButtonBase'
import { Record } from '../../icons/Record'

type Props = {
  toggleArmRecording(): void
  armed: boolean
  recording: boolean
}

export function ArmTrackRecording(props: Props) {
  return (
    <ButtonBase onClick={props.toggleArmRecording}>
      <Record {...props} />
    </ButtonBase>
  )
}
