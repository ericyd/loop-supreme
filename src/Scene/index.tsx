import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAudioContext } from '../AudioProvider'
import ButtonBase from '../ButtonBase'
import { useKeybindings } from '../hooks/use-keybindings'
import { Plus } from '../icons/Plus'
import { Record } from '../icons/Record'
import { Track } from '../Track'
import { RecordingMessage } from '../Track/RecorderNode'
import { logger } from '../util/logger'
import { ExportWavWorkerEvent, WavBlobControllerEvent } from '../workers/export'

type Props = {
  clock: Worker
  bpm: number
  measuresPerLoop: number
  beatsPerMeasure: number
}

export const Scene: React.FC<Props> = ({
  clock,
  bpm,
  measuresPerLoop,
  beatsPerMeasure,
}) => {
  const [tracks, setTracks] = useState([{ id: 1, selected: false }])
  const exportTarget = useMemo(() => new EventTarget(), [])
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)
  const exportWorker = useMemo(
    () => new Worker(new URL('../workers/export', import.meta.url)),
    []
  )

  const { audioContext } = useAudioContext()
  /**
   * Create a recorder worklet to record a session.
   * This worklet is passed to every track, and connected to the track's main GainNode on mount.
   * This way, the output from the GainNode is sent to the recorder worklet, and it all gets mixed into a single buffer.
   */
  const sessionWorklet = useMemo<AudioWorkletNode>(() => {
    // for the bounced recording, we can assume we'll always use 2 channels
    const numberOfChannels = 2

    const worklet = new AudioWorkletNode(audioContext, 'recorder', {
      processorOptions: {
        numberOfChannels: 2,
        sampleRate: audioContext.sampleRate,
        // 500 seconds... ? ¯\_(ツ)_/¯
        maxRecordingSamples: audioContext.sampleRate * 500,
        latencySamples: 0,
      },
    })

    worklet.port.onmessage = (event: MessageEvent<RecordingMessage>) => {
      if (event.data.message === 'MAX_RECORDING_LENGTH_REACHED') {
        // Not exactly sure what should happen in this case ¯\_(ツ)_/¯
        alert(
          "You recorded more than 500 seconds. That isn't allowed. Not sure why though, maybe it can record indefinitely?"
        )
        logger.error(event.data)
      }

      // See Track/index.tsx for detailed notes on the functionality here
      if (event.data.message === 'SHARE_RECORDING_BUFFER') {
        // this data is passed to the recorder worklet in `toggleRecording` function
        const recordingDurationSeconds =
          event.data.forwardData.recordingDurationSeconds
        const recordingDurationSamples = Math.ceil(
          audioContext.sampleRate * recordingDurationSeconds
        )
        logger.debug({
          recordingDurationSamples,
          recordingDurationSeconds,
          'event.data.channelsData[0].length':
            event.data.channelsData[0].length,
        })

        logger.debug(`Posting export message for scene performance`)
        exportWorker.postMessage({
          message: 'EXPORT_TO_WAV',
          audioBufferLength: recordingDurationSamples,
          numberOfChannels: numberOfChannels,
          sampleRate: audioContext.sampleRate,
          channelsData: event.data.channelsData.map((data) =>
            data.slice(0, recordingDurationSamples)
          ),
        } as ExportWavWorkerEvent)
      }
    }

    return worklet
  }, [audioContext, exportWorker])

  /**
   * Register callback to download the wav file when it is returned from the exporter worker
   */
  useEffect(() => {
    function handleWavBlob(event: MessageEvent<WavBlobControllerEvent>) {
      logger.debug(`Handling WAV message for scene performance`)
      if (event.data.message === 'WAV_BLOB' && downloadLinkRef.current) {
        const url = window.URL.createObjectURL(event.data.blob)
        downloadLinkRef.current.href = url
        downloadLinkRef.current.download = `performance-${timestamp()}.wav`
        downloadLinkRef.current.click()
        window.URL.revokeObjectURL(url)
      }
    }
    exportWorker.addEventListener('message', handleWavBlob)
    return () => {
      exportWorker.removeEventListener('message', handleWavBlob)
    }
  }, [exportWorker])

  /**
   * Allow the session recording to be toggled on and off.
   * The recording duration gets passed back to the app;
   * this is just a minor convenience to avoid storing the recording duration as yet another piece of state
   */
  const [recording, setRecording] = useState(false)
  const [recordingStart, setRecordingStart] = useState(0)
  const toggleRecording = useCallback(() => {
    setRecording((recording) => !recording)
    sessionWorklet.port.postMessage({
      message: 'TOGGLE_RECORDING_STATE',
      recordingDurationSeconds: (Date.now() - recordingStart) / 1000,
    })
    setRecordingStart(Date.now())
  }, [sessionWorklet, recordingStart])

  function handleAddTrack() {
    setTracks((tracks) => [
      ...tracks,
      { id: Math.max(...tracks.map((t) => t.id)) + 1, selected: false },
    ])
  }

  function handleRemoveTrack(idToRemove: number) {
    return () => {
      // cannot remove last track
      if (tracks.length > 1) {
        setTracks((tracks) => tracks.filter(({ id }) => id !== idToRemove))
      }
    }
  }

  const setSelected = (selectedIndex: number) => (event: KeyboardEvent) => {
    if ('123456789'.includes(event.key)) {
      setTracks((tracks) =>
        tracks.map((track, i) => ({
          ...track,
          selected: i + 1 === selectedIndex,
        }))
      )
    }

    if (event.key === '0') {
      setTracks((tracks) =>
        tracks.map((track, i) => ({
          ...track,
          selected: i + 1 === 10,
        }))
      )
    }
  }

  const deselectAll = useCallback(() => {
    setTracks((tracks) =>
      tracks.map((track, i) => ({
        ...track,
        selected: false,
      }))
    )
  }, [])

  /**
   * When called, exportTarget dispatches an event.
   * Tracks listen to this event and create a wav file blob from their audio buffer,
   * then download the file locally.
   */
  const handleExport = useCallback(() => {
    exportTarget.dispatchEvent(new Event('export'))
  }, [exportTarget])

  useKeybindings({
    a: { callback: handleAddTrack },
    ...new Array(10).fill(0).reduce(
      (map, _, i) => ({
        ...map,
        [i]: { callback: setSelected(i) },
      }),
      {}
    ),
    Escape: {
      callback: deselectAll,
      tagIgnoreList: [],
    },
  })

  return (
    <>
      {tracks.map(({ id, selected }, index) => (
        <Track
          key={id}
          id={id}
          index={index}
          selected={selected}
          onRemove={handleRemoveTrack(id)}
          clock={clock}
          exportTarget={exportTarget}
          sessionWorklet={sessionWorklet}
          bpm={bpm}
          measuresPerLoop={measuresPerLoop}
          beatsPerMeasure={beatsPerMeasure}
        />
      ))}
      <div className="my-8 flex justify-between items-end">
        <ButtonBase onClick={handleAddTrack} large>
          <Plus />
        </ButtonBase>
        <ButtonBase onClick={toggleRecording} large>
          <Record armed={false} recording={recording} />
        </ButtonBase>
        <button
          onClick={handleExport}
          className="border border-light-gray border-solid rounded-full p-2 mr-2 hover:shadow-button"
        >
          Download stems
        </button>
      </div>
      {/* Download element - inspired by this SO answer https://stackoverflow.com/a/19328891/3991555 */}
      <a
        ref={downloadLinkRef}
        href="https://loopsupreme.com"
        className="hidden"
      >
        Download
      </a>
    </>
  )
}

// returns a timestamp that is safe for any OS filename
function timestamp() {
  return new Date()
    .toISOString()
    .replace(/\.\d{0,5}Z$/, '')
    .replace(/:/g, '-')
}
