# Roadmap

This is a rough list of tasks that should be completed to consider this project "done"

## Project setup

- [x] create-react-app https://github.com/ericyd/loop-supreme/pull/1
- [x] configure tailwind https://github.com/ericyd/loop-supreme/pull/1
- [x] add project roadmap https://github.com/ericyd/loop-supreme/pull/2

## Metronome

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
- [ ] when Writer updates Metronome, current tick and measure reset to 0
- [x] Metronome Component must use Writer to set properties https://github.com/ericyd/loop-supreme/pull/3
- [x] Metronome Component must use Reader to display properties https://github.com/ericyd/loop-supreme/pull/3
- [x] Metronome must play an audible click on each tick https://github.com/ericyd/loop-supreme/pull/4
- [x] Metronome must initialize as "stopped", and can be "started" by user input https://github.com/ericyd/loop-supreme/pull/4
- [x] Metronome can be muted, while still running https://github.com/ericyd/loop-supreme/pull/11
- [ ] move "playing" state into MetronomeControls; there is no obvious need for it to live in Metronome

## Scene

A `Scene` is a collection of one or more Tracks. All Tracks in a Scene are synchronized to the same length.

- [x] Component has one or more Tracks https://github.com/ericyd/loop-supreme/pull/5
- [x] Component can add Tracks https://github.com/ericyd/loop-supreme/pull/5
- [x] ~Component can remove Tracks~ moving functionality to `Track` https://github.com/ericyd/loop-supreme/pull/5
- [ ] Component has x-axis that visually corresponds to the time signature and measure count
- [ ] Component has a vertical line that tracks the current tick/current measure
- [ ] global lock prevents recording multiple tracks at once

## Track

A `Track` is a single mono or stereo audio buffer that contains audio data. A `Track` can be armed for recording, de-armed, muted, and unmuted. By default, the audio data in a `Track` will loop indefinitely. The audio data in a `Track` can be cleared.

- [x] create Component https://github.com/ericyd/loop-supreme/pull/5
  - shape: rectangle. Spans width of `Scene`
- [x] Component can remove itself from scene https://github.com/ericyd/loop-supreme/pull/5
- [x] Component has arm toggle button https://github.com/ericyd/loop-supreme/pull/8
- [ ] audio data can be cleared from component without deleting it (to preserve track name)
- [x] deleting a track stops playback https://github.com/ericyd/loop-supreme/pull/13
- [x] Component can record data from user device https://github.com/ericyd/loop-supreme/pull/8
- [ ] Component shows waveform of recorded audio
- [x] Component can adjust volume of playback https://github.com/ericyd/loop-supreme/pull/13
- [x] Component has mute toggle button https://github.com/ericyd/loop-supreme/pull/13
- [x] Audio input can be monitored, or not https://github.com/ericyd/loop-supreme/pull/13
- [x] When Component is armed for recording, audio data is recorded starting at the beginning of the next loop, and automatically stops at the beginning of the following loop https://github.com/ericyd/loop-supreme/pull/9
- [x] recording accounts for audio latency https://github.com/ericyd/loop-supreme/pull/12
- [ ] Component gets confirmation before deleting track
- [ ] Fix Recording button styling/class (use Tailwind)
- [ ] Ensure the audio buffer is always exactly as long as it needs to be to fill the loop

## Saving audio

- [ ] Stems can be exported
- [ ] Bounced master can be exported
- [ ] Live performance can be saved and exported

## Keyboard

- [ ] Keyboard shortcuts are added for most common actions
  - `1`, `2`, `3`, etc select a track
  - once a track is selected, `r` toggles "armed for recording", `m` toggles mute
  - `t` is "tap tempo"
  - `space` is play/pause

## HTML

- [ ] flesh out header (add links to blog, etc)
- [ ] track page views
- [ ] OG tags, SEO

## Deploy

- [ ] building (GH Actions)
  - probably will need to "eject" CRA so I can customize webpack resolve hook.
  - https://webpack.js.org/configuration/resolve/.
  - Currently getting this error in built app: "Error: Module resolve hook not set"
- [ ] hosting (GH pages???)

## Misc

- [ ] Allow user to change inputs https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices. This method returns `Array<MediaDeviceInfo>` which looks like this:

```json
[
  {
    "deviceId": "fawzsPrkZbQN9fojBcmG6nlJp0DMXbkmPUxyNMrepqk=",
    "groupId": "oJkNwmfoCVJ/Gy/1koTeGXQCaMLs22CBhWe2KT0Tdxs=",
    "kind": "audioinput",
    "label": "HD Pro Webcam C920"
  }
]
```

- [ ] clean up TODOs
- [ ] show alert to user if latency cannot be detected, either due to their environment or their chosen input. This will result in a terrible experience.
      (Consider adding a "custom latency" input option???)
