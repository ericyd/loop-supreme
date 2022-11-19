import { logger } from '../util/logger'

type Props = {
  gainValues: number[]
}
export default function Waveform(props: Props) {
  // gain seems to be reported in range [-1, 1]
  const minGainValue = Math.min(...props.gainValues)
  const maxGainValue = Math.max(...props.gainValues)
  const outputRange = [0, 2] as const
  logger.debug({
    minGainValue,
    maxGainValue,
  })
  return (
    <svg
      // TODO: is this the right way to set these props?
      height="100%"
      width="100%"
      clipRule="evenodd"
      fillRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      viewBox="0 0 200 2"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className=""
    >
      <path
        fill="none"
        stroke="#000000"
        strokeWidth={0.1}
        d={`M0 1 ${props.gainValues
          // TODO: there is no guarantee that i will be in range [0, 200]; need to programmatically set how to expect this
          // 120 bpm @ 60hz @ 44100 sample rate @ 2 measures @ 4/4 time ~= 197 samples.
          // do the math. and figure out what props need to be passed
          .map(
            (gain, i) =>
              `L ${i} ${map(
                minGainValue,
                maxGainValue,
                outputRange[0],
                outputRange[1],
                gain
              )}`
          )
          .join(' ')}`}
      />
    </svg>
  )
}

// taken from p5js https://github.com/processing/p5.js/blob/689359331166d085430146d4b6776a12d6a9c588/src/math/calculation.js#L448-L459
function map(
  beforeLeft: number,
  beforeRight: number,
  afterLeft: number,
  afterRight: number,
  value: number
) {
  const newval =
    ((value - beforeLeft) / (beforeRight - beforeLeft)) *
      (afterRight - afterLeft) +
    afterLeft
  // return newval
  if (afterLeft < afterRight) {
    return clamp(afterRight, afterLeft, newval)
  } else {
    return clamp(afterLeft, afterRight, newval)
  }
}

// https://github.com/processing/p5.js/blob/689359331166d085430146d4b6776a12d6a9c588/src/math/calculation.js#L110-L113
function clamp(high: number, low: number, value: number) {
  return Math.max(Math.min(value, high), low)
}
