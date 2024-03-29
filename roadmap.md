# Roadmap

This is a rough list of tasks that should be completed to consider this project "done"

## ✅ Project setup

- [x] create-react-app https://github.com/ericyd/loop-supreme/pull/1
- [x] configure tailwind https://github.com/ericyd/loop-supreme/pull/1
- [x] add project roadmap https://github.com/ericyd/loop-supreme/pull/2

## ✅ Metronome

The `Metronome` is the heart of the app. The BPM, measure, current tick, and time signature should be synchronized to all the components. The metronome will probably be a Context, accessed via a hook that returns a Reader and Writer

- [x] create context https://github.com/ericyd/loop-supreme/pull/3
- [x] add hook to return Writer and Reader https://github.com/ericyd/loop-supreme/pull/3
- [x] Reader must be able to read https://github.com/ericyd/loop-supreme/pull/3
  - current tick
  - measure
  - BPM
  - time signature
- [x] Writer must be able to set https://github.com/ericyd/loop-supreme/pull/3
  - BPM
  - time signature
  - measure count
- [x] ~when Writer updates Metronome, current tick and measure reset to 0~ decided this is not important
- [x] Metronome Component must use Writer to set properties https://github.com/ericyd/loop-supreme/pull/3
- [x] Metronome Component must use Reader to display properties https://github.com/ericyd/loop-supreme/pull/3
- [x] Metronome must play an audible click on each tick https://github.com/ericyd/loop-supreme/pull/4
- [x] Metronome must initialize as "stopped", and can be "started" by user input https://github.com/ericyd/loop-supreme/pull/4
- [x] Metronome can be muted, while still running https://github.com/ericyd/loop-supreme/pull/11
- [x] ~move "playing" state into MetronomeControls; there is no obvious need for it to live in Metronome~ irrelevant after https://github.com/ericyd/loop-supreme/pull/28

## Scene

A `Scene` is a collection of one or more Tracks. All Tracks in a Scene are synchronized to the same length.

- [x] Component has one or more Tracks https://github.com/ericyd/loop-supreme/pull/5
- [x] Component can add Tracks https://github.com/ericyd/loop-supreme/pull/5
- [x] ~Component can remove Tracks~ moving functionality to `Track` https://github.com/ericyd/loop-supreme/pull/5
- [ ] Component has x-axis that visually corresponds to the time signature and measure count
- [ ] Component has a vertical line that tracks the current tick/current measure
- [ ] global lock prevents recording multiple tracks at once

## ✅ Track

A `Track` is a single mono or stereo audio buffer that contains audio data. A `Track` can be armed for recording, de-armed, muted, and unmuted. By default, the audio data in a `Track` will loop indefinitely. The audio data in a `Track` can be cleared.

- [x] create Component https://github.com/ericyd/loop-supreme/pull/5
  - shape: rectangle. Spans width of `Scene`
- [x] Component can remove itself from scene https://github.com/ericyd/loop-supreme/pull/5
- [x] Component has arm toggle button https://github.com/ericyd/loop-supreme/pull/8
- [x] ~audio data can be cleared from component without deleting it (to preserve track name)~ just mute, and then re-record if desired
- [x] `regression` allow re-recording audio over a track [regression introduced here](https://github.com/ericyd/loop-supreme/pull/27) https://github.com/ericyd/loop-supreme/pull/34
- [x] deleting a track stops playback https://github.com/ericyd/loop-supreme/pull/13
- [x] Component can record data from user device https://github.com/ericyd/loop-supreme/pull/8
- [x] Component shows waveform of recorded audio https://github.com/ericyd/loop-supreme/pull/20
- [x] Component can adjust volume of playback https://github.com/ericyd/loop-supreme/pull/13
- [x] Component has mute toggle button https://github.com/ericyd/loop-supreme/pull/13
- [x] Audio input can be monitored, or not https://github.com/ericyd/loop-supreme/pull/13
- [x] When Component is armed for recording, audio data is recorded starting at the beginning of the next loop, and automatically stops at the beginning of the following loop https://github.com/ericyd/loop-supreme/pull/9
- [x] recording accounts for audio latency https://github.com/ericyd/loop-supreme/pull/12
- [x] Component gets confirmation before deleting track https://github.com/ericyd/loop-supreme/pull/15
- [x] Fix Recording button styling/class (use Tailwind) https://github.com/ericyd/loop-supreme/pull/15
- [x] Ensure the audio buffer is always exactly as long as it needs to be to fill the loop https://github.com/ericyd/loop-supreme/pull/23
- [x] clean up functionality from recorder worklet that isn't being used (might want to hold off until I know how visualization will work) https://github.com/ericyd/loop-supreme/pull/20

## ✅ Saving audio

- [x] Stems can be exported https://github.com/ericyd/loop-supreme/pull/26
- [x] ~Bounced master can be exported~ not entirely sure what my goal was here...
- [x] Live performance can be saved and exported https://github.com/ericyd/loop-supreme/pull/37

## ✅ Keyboard

- [x] Keyboard shortcuts are added for most common actions https://github.com/ericyd/loop-supreme/pull/24
  - [x] `1`, `2`, `3`, etc select a track
  - [x] once a track is selected, `r` toggles "armed for recording", `m` toggles mute
  - [x] `space` is play/pause
- [x] add "tap tempo" functionlity and bind to `t` key https://github.com/ericyd/loop-supreme/pull/32

## ✅ HTML

- [x] flesh out header (add links to blog, etc) https://github.com/ericyd/loop-supreme/pull/16
- [x] track page views (done automatically through Cloudflare)
- [x] OG tags, SEO https://github.com/ericyd/loop-supreme/pull/16

## ✅ Deploy

- [x] building (GH Actions) https://github.com/ericyd/loop-supreme/pull/17 and https://github.com/ericyd/loop-supreme/pull/19
- [x] hosting (Cloudflare)

## ✅ Misc

- [x] `Bug`: using keyboard shortcuts is causing weird recording artifacts... 😭 https://github.com/ericyd/loop-supreme/pull/30
- [x] clean up "start" button/view
- [x] Allow user to change inputs https://github.com/ericyd/loop-supreme/pull/25
- [x] clean up TODOs https://github.com/ericyd/loop-supreme/pull/32
- [x] show alert to user if latency cannot be detected due to their environment
- [x] ~show alert if track latency cannot be detected, or if it seems wildly out of the norm (~100ms +/ 20ms ???). Consider adding a "custom latency" input option???~ punting on this until I see the demand
- [x] remove useInterval hook (not used)
- [x] investigate network calls to workers. https://github.com/ericyd/loop-supreme/pull/21
- [x] keyboard bindings should respect certain boundaries. For example, renaming tracks causes all sorts of things to fire, e.g. `a`, `m`, `r`, `c` all do things that probably shouldn't happen. https://github.com/ericyd/loop-supreme/pull/29

## Design

- [ ] Use brand colors for range inputs
- [x] Use brand colors for all colors! https://github.com/ericyd/loop-supreme/pull/36
- [x] Add dark mode capabilities (honor system preferences)
- [x] ~Add dark mode toggle button~ respecting system preferences should be sufficient
- [x] allow Track to wrap (controls top, waveform bottom)
- [ ] make Track controls slightly less wide
- [x] add track ID indicator so keyboard controls make sense
- [x] make beat counter sticky so you can see it even when you scroll

## Enhancements

- [ ] allow changing tempo by typing value into an input
- [x] add workbox so PWA can be installed https://github.com/ericyd/loop-supreme/pull/36
- [x] is it possible to pass a Worker port to an AudioWorklet? If so, refactor so the app doesn't need to interact with the Waveform worker at all (currently app acts as a proxy between the Recording Processor and the Waveform worker)
  - no, not possible
- [ ] add a "quantize" function
  - bonus challenge: implement this using a WASM module inside a Worker (https://github.com/peter-suggate/wasm-audio-app)
- [ ] add manual echo cancellation (this will need to be a worker for sure, it is going to be a beefy algorithm)
