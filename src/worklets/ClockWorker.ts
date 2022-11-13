type ClockWorkerStartMessage = {
  message: 'start'
  bpm: number
  beatsPerMeasure: number
  measureCount: number
}

type ClockWorkerUpdateMessage = {
  message: 'update'
  bpm: number
  beatsPerMeasure: number
  measureCount: number
}

type ClockWorkerStopMessage = {
  message: 'stop'
}

export type ClockWorkerMessage =
  | ClockWorkerStartMessage
  | ClockWorkerUpdateMessage
  | ClockWorkerStopMessage

export type ClockConsumerMessage = {
  currentTick: number
  // true on the first beat of each measure
  downbeat: boolean
  // true on the first beat of each loop
  loopStart: boolean
  message: 'tick'
}
