export type WaveformWorkerFrameMessage = {
  message: 'FRAME'
  gain: number
  samplesPerFrame: number
}

export type WaveformWorkerInitializeMessage = {
  message: 'INITIALIZE'
  yMax: number
  xMax: number
  sampleRate: number
}

export type WaveformWorkerMetronomeMessage = {
  message: 'UPDATE_METRONOME'
  loopLengthSeconds: number
}

export type WaveformWorkerResetMessage = {
  message: 'RESET_FRAMES'
}

export type WaveformWorkerMessage =
  | WaveformWorkerFrameMessage
  | WaveformWorkerInitializeMessage
  | WaveformWorkerMetronomeMessage
  | WaveformWorkerResetMessage

export type WaveformControllerMessage = {
  message: 'WAVEFORM_PATH'
  path: string
  minGain: number
  maxGain: number
}

// postMessage({ message: 'waveform processor ready' })

// an array of each "gain" value for ever frame in the loop
let frames: number[] = []

// values corresponding to the waveform scaling
const yMin = 0
let yMax = 1
let xMax = 1
let samplesPerSecond = 1
let minGain = 0
let maxGain = 0
let samplesPerLoop = 1

// must add `webWorker` to `compilerOptions.lib` prop of tsconfig.json
const self = globalThis as unknown as DedicatedWorkerGlobalScope

self.onmessage = (e: MessageEvent<WaveformWorkerMessage>) => {
  if (e.data.message === 'FRAME') {
    // Absolute value gives us the "top" of the waveform; the "bottom" is calculated below in pathNegative
    const frameGain = Math.abs(e.data.gain)
    frames.push(frameGain)
    minGain = Math.min(minGain, frameGain)
    maxGain = Math.max(maxGain, frameGain)
    const framesPerLoop = Math.ceil(samplesPerLoop / e.data.samplesPerFrame)

    postMessage({
      message: 'WAVEFORM_PATH',
      path: constructPath({
        frames,
        framesPerLoop,
        xMax,
        yMin,
        yMax,
        minGain,
        maxGain,
      }),
      minGain,
      maxGain,
    } as WaveformControllerMessage)
  }

  if (e.data.message === 'INITIALIZE') {
    // yMax is actually the height; since we have a "top" and "bottom" waveform, we only need half for our scaling
    yMax = e.data.yMax / 2
    xMax = e.data.xMax
    samplesPerSecond = e.data.sampleRate
  }

  if (e.data.message === 'UPDATE_METRONOME') {
    // This is all to get the number of frames per loop.
    // Each data point on the waveform corresponds to a frame (many samples).
    // To correctly position the point along the x axis, we need to know how many frames to expect for the whole loop.
    samplesPerLoop = samplesPerSecond * e.data.loopLengthSeconds
  }

  if (e.data.message === 'RESET_FRAMES') {
    frames = []
    minGain = 0
    maxGain = 0
  }
}

type PathConstructionParams = {
  frames: number[]
  framesPerLoop: number
  xMax: number
  minGain: number
  maxGain: number
  yMin: number
  yMax: number
}

/**
 * @returns string a fully formed path string
 */
export function constructPath({
  frames,
  framesPerLoop,
  xMax,
  minGain,
  maxGain,
  yMin,
  yMax,
}: PathConstructionParams) {
  // on the first pass, we create [x, y] pairs for each point.
  // x is a simple fraction of the total x-axis length.
  // y is normalized to the scale of the waveform.
  // This represents the "top" of the closed waveform shape; the bottom is created below
  const positivePoints = frames.map((gain, i) => [
    (i / framesPerLoop) * xMax,
    map(minGain, maxGain, yMin, yMax, gain),
  ])

  // pathNegative is reversed because the end of the waveform top (positivePoints)
  // should connect to the end of the waveform bottom (pathNegative)
  const negativePoints = positivePoints.map(([x, y]) => [x, y * -1]).reverse()

  // construct the SVG path command
  const first = positivePoints[0]
  const firstPoint = [
    'M',
    handleNaN(round2(first[0])),
    handleNaN(round2(first[1])),
  ].join(' ')
  const positivePath = smoothCubicBezierPoints(
    positivePoints.slice(1),
    xMax / framesPerLoop / 2
  )
  // Since the positive and negative paths are drawn in reverse order,
  // the "xControlPointOffset" must be "* -1", so the control point is on the correct side of the end point.
  const negativePath = smoothCubicBezierPoints(
    negativePoints,
    -xMax / framesPerLoop / 2
  )
  return [firstPoint, positivePath, negativePath, `Z`].join(' ')
}

// algorithm taken from p5js https://github.com/processing/p5.js/blob/689359331166d085430146d4b6776a12d6a9c588/src/math/calculation.js#L448-L459
// with naming taken from openrndr https://github.com/openrndr/openrndr/blob/2ca048076f6999cd79aee0d5b3db471152f59063/openrndr-math/src/commonMain/kotlin/org/openrndr/math/Mapping.kt#L8-L33
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
  if (afterLeft < afterRight) {
    return clamp(afterLeft, afterRight, newval)
  } else {
    return clamp(afterRight, afterLeft, newval)
  }
}

// https://github.com/processing/p5.js/blob/689359331166d085430146d4b6776a12d6a9c588/src/math/calculation.js#L110-L113
function clamp(low: number, high: number, value: number) {
  return Math.max(Math.min(value, high), low)
}

// function straightLines(points: number[][]): string {
//   return points.map(([x, y]) => `L ${x} ${y}`).join(' ')
// }

function smoothCubicBezierPoints(
  points: number[][],
  xControlPointOffset: number
): string {
  return points
    .map((pt) => {
      const y = handleNaN(round2(pt[1]))
      const x = handleNaN(round2(pt[0]))
      const xOffset = handleNaN(round2(pt[0] - xControlPointOffset))
      return `S ${xOffset},${y} ${x},${y}`
    })
    .join(' ')
}

function roundN(decimalCount: number): (decimal: number) => number {
  return (decimal: number) =>
    Math.round(decimal * Math.pow(10, decimalCount)) /
    Math.pow(10, decimalCount)
}
const round2 = roundN(2)

function handleNaN(value: number) {
  return Number.isNaN(value) ? 0.0 : value
}
