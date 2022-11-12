/**
 * Why a Worker instead of an AudioWorkletProcessor?
 *    Turns out AudioWorkletProcessors don't have access to setInterval!
 * Why JS?
 *    I don't want to go through the hassle of getting a TS file into my build pipeline;
 *    The AudioContext.audioWorklet.addModule method expects a JS file path. If this were TS
 *    I believe I'd have to compile it first, then output the JS file to the src directory.
 *    That feels like a massive headache so going with the simple option first.
 *    (This is also why this is located in the public directory)
 * The code in this file was heavily inspired by this Google example, and Monica Dinculescu's fantastic metronome test/example code:
 *    https://github.com/GoogleChromeLabs/web-audio-samples/blob/eed2a8613af551f2b1d166a01c834e8431fdf3c6/src/audio-worklet/migration/worklet-recorder/recording-processor.js
 *    https://glitch.com/edit/#!/metronomes?path=worker.js%3A1%3A0
 * Why setInterval?
 *    I found that using setInterval in the client-side app was creating really bad latency
 *    between the recording and the metronome. I decided to migrate to a worklet to reduce
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

postMessage('worker says hi')

let timeoutId
let currentTick = -1

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e) => {
  if (e.data.message === 'start') {
    const { bpm, beatsPerMeasure, measureCount } = e.data

    timeoutId = setInterval(() => {
      currentTick = (currentTick + 1) % (beatsPerMeasure * measureCount)
      postMessage({
        message: 'tick',
        currentTick,
        downbeat: currentTick % beatsPerMeasure === 0,
        loopStart: currentTick === 0,
      })
    }, (60 / bpm) * 1000)
  } else if (e.data.message === 'stop') {
    clearInterval(timeoutId)
  }
}
