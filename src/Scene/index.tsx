import React, { useCallback, useEffect, useState } from 'react'
import ButtonBase from '../ButtonBase'
import { Plus } from '../icons/Plus'
import { useKeyboard } from '../KeyboardProvider'
import { MetronomeReader } from '../Metronome'
import { Track } from '../Track'

type Props = {
  metronome: MetronomeReader
}

export const Scene: React.FC<Props> = ({ metronome }) => {
  const keyboard = useKeyboard()
  keyboard.on('a', handleAddTrack)
  const [tracks, setTracks] = useState([{ id: 1, selected: false }])

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

  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      keyboard.on(String(i), setSelected(i))
    }
    return () => {
      for (let i = 0; i < 10; i++) {
        keyboard.off(String(i), setSelected(i))
      }
    }
  }, [keyboard])

  return (
    <>
      {tracks.map(({ id, selected }) => (
        <Track
          key={id}
          id={id}
          selected={selected}
          onRemove={handleRemoveTrack(id)}
          metronome={metronome}
        />
      ))}
      <div className="my-8">
        <ButtonBase onClick={handleAddTrack} large>
          <Plus />
        </ButtonBase>
      </div>
    </>
  )
}
