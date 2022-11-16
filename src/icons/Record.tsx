type Props = {
  fill: string
}

export const Record: React.FC<Props> = (props) => (
  <svg
    clipRule="evenodd"
    fillRule="evenodd"
    strokeLinejoin="round"
    strokeMiterlimit="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6"
  >
    <title>Arm for recording</title>
    <circle cx="12" cy="12" fillRule="nonzero" r="10" fill={props.fill} />
  </svg>
)
