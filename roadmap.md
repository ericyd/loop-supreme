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

## Scene

A `Scene` is a collection of one or more Tracks. All Tracks in a Scene are synchronized to the same length.

- [x] Component has one or more Tracks
- [x] Component can add Tracks
- [ ] ~Component can remove Tracks~ moving functionality to `Track`
- [ ] Component has x-axis that visually corresponds to the time signature and measure count
- [ ] Component has a vertical line that tracks the current tick/current measure

## Track

A `Track` is a single mono or stereo audio buffer that contains audio data. A `Track` can be armed for recording, de-armed, muted, and unmuted. By default, the audio data in a `Track` will loop indefinitely. The audio data in a `Track` can be cleared.

- [x] create Component
  - shape: rectangle. Spans width of `Scene`
- [x] Component can remove itself from scene
- [ ] Component has arm toggle button
- [ ] Component has mute toggle button
- [ ] audio data can be cleared from component
- [ ] Component can record data from user device
- [ ] Component shows waveform of recorded audio
- [ ] Component can adjust volume of playback
- [ ] When Component is armed for recording, audio data is recorded starting at the beginning of the next loop, and automatically stops at the beginning of the following loop

## Saving audio

- [ ] Stems can be exported
- [ ] Bounced master can be exported
- [ ] Live performance can be saved and exported

## Keyboard

- [ ] Keyboard shortcuts are added for most common actions
  - `1`, `2`, `3`, etc select a track
  - once a track is selected, `r` toggles "armed for recording", `m` toggles mute
  - `t` is "tap tempo"
