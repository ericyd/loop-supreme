import React, { useState } from 'react'
import { Container } from '../Container'
import { Plus } from '../icons/Plus'
import { MetronomeReader } from '../Metronome'
import { Track } from '../Track'

type Props = {
  metronome: MetronomeReader
}

export const Scene: React.FC<Props> = ({ metronome }) => {
  const [tracks, setTracks] = useState([{ id: 1 }])

  function handleAddTrack() {
    setTracks((tracks) => [
      ...tracks,
      { id: Math.max(...tracks.map((t) => t.id)) + 1 },
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

  return (
    <Container title="Scene">
      <div className="mb-2">
        <button
          className="p-2 border border-zinc-400 border-solid rounded-sm"
          onClick={handleAddTrack}
        >
          <Plus />
        </button>
      </div>
      {tracks.map(({ id }) => (
        <Track
          key={id}
          id={id}
          onRemove={handleRemoveTrack(id)}
          metronome={metronome}
        />
      ))}
    </Container>
  )
}
