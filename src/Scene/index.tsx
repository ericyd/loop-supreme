import React, { useState } from 'react'
import { Container } from '../Container'
import { Track } from '../Track'

export const Scene: React.FC = () => {
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
      <div>
        <button
          className="p-2 border border-zinc-400 border-solid rounded-sm"
          onClick={handleAddTrack}
        >
          Add track
        </button>
      </div>
      {tracks.map(({ id }) => (
        <Track key={id} id={id} onRemove={handleRemoveTrack(id)} />
      ))}
    </Container>
  )
}
