/**
 * Why a Worker instead of an AudioWorkletProcessor?
 *    Turns out AudioWorkletProcessors don't have access to setInterval!
 * The code in this file was heavily inspired by Monica Dinculescu's fantastic metronome test/example code:
 *    https://glitch.com/edit/#!/metronomes?path=worker.js%3A1%3A0
 * Why setInterval?
 *    I found that using setInterval in the client-side app was creating really bad latency
 *    between the recording and the metronome. I decided to migrate to a worker to reduce
 *    the chance timing issues due to blocking code on the main thread (e.g. from React).
 *    However, this still may not be the endgame.
 *    This fantastic blog post[1] and the accompanying example code[2] demonstrate that using
 *    setInterval in a WebWorker still has imperfect timing issues.
 *    The "perfect" solution is to pre-schedule events and use the AudioContext clock to execute them.
 *    This is great for playback-only purposes, but the problem is that the AudioContext clock does not
 *    emit events at certain times. This app needs to be able to automatically start and end recordings
 *    when the loop starts and stops. Therefore, we need some type of event-driven clock[3].
 * [1] https://meowni.ca/posts/metronomes/
 * [2] https://metronomes.glitch.me/
 * [3] It is of course possible that there are simpler alternatives that I'm not aware of!
 *     This is a learning process for me and this may change in the future.
 */

export type ClockWorkerStartMessage = {
  message: 'START'
  bpm: number
  beatsPerMeasure: number
  measuresPerLoop: number
}

export type ClockWorkerUpdateMessage = {
  message: 'UPDATE'
  bpm: number
  beatsPerMeasure: number
  measuresPerLoop: number
}

export type ClockWorkerStopMessage = {
  message: 'STOP'
}

type ClockWorkerMessage =
  | ClockWorkerStartMessage
  | ClockWorkerUpdateMessage
  | ClockWorkerStopMessage

export type ClockControllerMessage = {
  message: 'TICK'
  currentTick: number
  // true on the first beat of each measure
  downbeat: boolean
  // true on the first beat of each loop
  loopStart: boolean
  bpm: number
  measuresPerLoop: number
  beatsPerMeasure: number
}

// must add `webWorker` to `compilerOptions.lib` prop of tsconfig.json
const self = globalThis as unknown as DedicatedWorkerGlobalScope

postMessage({ message: 'clock ready' })

let timeoutId: NodeJS.Timer | null = null
let currentTick = -1

self.onmessage = (e: MessageEvent<ClockWorkerMessage>) => {
  function start(
    bpm: number,
    beatsPerMeasure: number,
    measuresPerLoop: number
  ) {
    // post one message immediately so the start doesn't appear delayed by one beat
    currentTick = (currentTick + 1) % (beatsPerMeasure * measuresPerLoop)
    postMessage({
      message: 'TICK',
      currentTick,
      downbeat: currentTick % beatsPerMeasure === 0,
      loopStart: currentTick === 0,
      bpm,
      beatsPerMeasure,
      measuresPerLoop,
    })
    timeoutId = setInterval(() => {
      currentTick = (currentTick + 1) % (beatsPerMeasure * measuresPerLoop)
      postMessage({
        message: 'TICK',
        currentTick,
        downbeat: currentTick % beatsPerMeasure === 0,
        loopStart: currentTick === 0,
        bpm,
        beatsPerMeasure,
        measuresPerLoop,
      } as ClockControllerMessage)
    }, (60 / bpm) * 1000)
  }

  if (e.data.message === 'START') {
    start(e.data.bpm, e.data.beatsPerMeasure, e.data.measuresPerLoop)
  } else if (e.data.message === 'STOP') {
    clearInterval(timeoutId!)
    timeoutId = null
  } else if (e.data.message === 'UPDATE') {
    // only start if it was already running
    if (timeoutId) {
      clearInterval(timeoutId)
      start(e.data.bpm, e.data.beatsPerMeasure, e.data.measuresPerLoop)
    }
  }
}

// " 'clock.ts' cannot be compiled under '--isolatedModules' because it is considered a global script file.
//   Add an import, export, or an empty 'export {}' statement to make it a module.ts(1208) "
export {}
