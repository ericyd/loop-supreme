<p align="center">
  <img src="./public/icons/loop-supreme-cover-art.svg" height="200px" alt="Loop Supreme">
</p>

<p align="center">
  <strong><em>Browser-based live looper for music performance and audio fun!</em></strong>
</p>

- [How to use](#how-to-use)
- [Motivation](#motivation)
- [What features does this have?](#what-features-does-this-have)
- [Where can I read more?](#where-can-i-read-more)
- [Building / running locally](#building-running-locally)
- [Useful resources in my Web Audio journey](#useful-resources-in-my-web-audio-journey)
- [Acknowledgements](#acknowledgements)

## How to use

Please [check out the wiki](https://github.com/ericyd/loop-supreme/wiki)

## Motivation

I wanted to do some live looping on my keyboard but wasn't super satisfied with any of the options out there. I wanted something quick-and-dirty but made it (somewhat) easy to do a loop performance.

I've also been itching for a side project. Seemed like a great way to feed two birds with one scone!

## What features does this have?

You can check out [The Roadmap](./roadmap.md)!

## Where can I read more?

I blogged about this as I made it

* [Part 12: v1.0 release, and project retro](https://ericyd.hashnode.dev/loop-supreme-part-12-v10-release-and-project-retro)
* [Part 11: Exporting stems and changing inputs](https://ericyd.hashnode.dev/loop-supreme-part-11-exporting-stems-and-changing-inputs)
* [Part 10: Keyboard bindings](https://ericyd.hashnode.dev/loop-supreme-part-10-keyboard-bindings)
* [Part 9: Visualizing the waveform](https://ericyd.hashnode.dev/loop-supreme-part-9-visualizing-the-waveform)
* [Part 8: Building and hosting](https://ericyd.hashnode.dev/loop-supreme-part-8-building-and-hosting)
* [Part 7: Latency and adding Track functionality](https://ericyd.hashnode.dev/loop-supreme-part-7-latency-and-adding-track-functionality)
* [Part 6: Workers and AudioWorklets](https://ericyd.hashnode.dev/loop-supreme-part-6-workers-and-audioworklets)
* [Part 5: Record and loop a track](https://ericyd.hashnode.dev/loop-supreme-part-5-record-and-loop-a-track)
* [Part 4: Adding a Scene](https://ericyd.hashnode.dev/loop-supreme-part-4-adding-a-scene)
* [Part 3: Metronome click](https://ericyd.hashnode.dev/loop-supreme-part-3-metronome-click)
* [Part 2: Adding a Metronome](https://ericyd.hashnode.dev/loop-supreme-part-2-adding-a-metronome)
* [Part 1: New project: building a web-based audio looper!](https://ericyd.hashnode.dev/new-project-building-a-web-based-audio-looper)

## Building / running locally

```shell
git clone git@github.com:ericyd/loop-supreme
cd loop-supreme
npm i
npm start
npm run build
```

## Useful resources in my Web Audio journey

- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth: great example of building a simple OscillatorNode!
- https://github.com/mdn/webaudio-examples
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques#playing_the_audio_in_time
- https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
- https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
- https://www.1001freefonts.com/chicle.font (used in the logo)
- synchronization and timing
  - https://web.dev/audio-output-latency/
  - https://blog.paul.cx/post/audio-video-synchronization-with-the-web-audio-api/
    - https://blog.paul.cx/post/metronome/
    - https://meowni.ca/posts/metronomes/
    - https://web.dev/audio-scheduling/
  - Audio Worklet
    - https://developer.chrome.com/blog/audio-worklet/
    - https://googlechromelabs.github.io/web-audio-samples/audio-worklet/
    - https://developer.chrome.com/blog/audio-worklet-design-pattern/
    - https://github.com/GoogleChromeLabs/web-audio-samples/tree/main/src/audio-worklet/migration/worklet-recorder
- inspiration
  - https://github.com/pkalogiros/AudioMass/

## Acknowledgements

- Metronome by ChangHoon Baek from <a href="https://thenounproject.com/icon/metronome-118052/" target="_blank" title="Metronome Icons">Noun Project</a>
- Cloudflare Pages has an amazing free hosting tier, and great admin and tooling
- create-react-app is still going strong and super useful
- [Chicle font](https://fonts.google.com/specimen/Chicle) used in the logo, copyright (c) 2011 Angel Koziupa (sudtipos@sudtipos.com) and copyright (c) 2011 Alejandro Paul (sudtipos@sudtipos.com)
- MDN, what would we do without you
