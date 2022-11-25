/**
 * Exposes a context that can be used to bind keyboard events throughout the app.
 * Keydown/Keyup listeners are easy to add, but the syntax is kind of annoying
 * because the callback has to check for the right key.
 * This is a more convenient wrapper for `window.addEventListener('keydown', callback).
 * Perhaps this doesn't need to be a context at all, and can just be an exported function
 * that wraps `window.addEventListener` -- we'll see!
 *
 * (intended) Usage:
 *
 * function MyComponent() {
 *   const keyboard = useKeyboard()
 *
 *   function myFunction() {
 *     // do something
 *   }
 *
 *   keyboard.on('a', 'id', myFunction)
 * }
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { logger } from '../util/logger'

type KeyboardEventHandler = (event: KeyboardEvent) => void

type KeyboardController = {
  on(key: string, id: string, callback: KeyboardEventHandler): void
  off(key: string, id: string): void
}

type EventHandler = {
  id?: string
  callback: KeyboardEventHandler
}
type CallbackMap = Record<string, EventHandler[]>

const KeyboardContext = createContext<KeyboardController | null>(null)

type Props = {
  children: React.ReactNode
}

export const KeyboardProvider: React.FC<Props> = ({ children }) => {
  // callbackMap is a map of keys to EventHandlers.
  // EventHandlers contain an (optional) ID and a callback.
  // The ID allows deduplication, so that multiple event registrations
  // do not result in multiple callback calls.
  // The ID also allows us to register multiple EventHandlers for a single key;
  // this is primarily useful for the event registrations on Tracks,
  // since they are added and removed depending on whether the track is selected.
  const callbackMap: CallbackMap = useMemo(
    () => ({
      Escape: [
        {
          callback: () => {
            // @ts-expect-error this is totally valid, not sure why TS doesn't think so
            const maybeFn = document.activeElement?.blur?.bind(
              document.activeElement
            )
            if (typeof maybeFn === 'function') {
              maybeFn()
            }
          },
        },
      ],
    }),
    []
  )

  useEffect(() => {
    const keydownCallback = (e: KeyboardEvent) => {
      logger.debug({ key: e.key, meta: e.metaKey, shift: e.shiftKey })
      callbackMap[e.key]?.map((item) => item.callback(e))
    }
    window.addEventListener('keydown', keydownCallback)
    return () => {
      window.removeEventListener('keydown', keydownCallback)
    }
  }, [callbackMap])

  const controller = {
    on(key: string, id: string, callback: KeyboardEventHandler) {
      if (Array.isArray(callbackMap[key])) {
        const index = callbackMap[key].findIndex((item) => item.id === id)
        if (index < 0) {
          callbackMap[key].push({ id, callback })
        } else {
          callbackMap[key][index] = { id, callback }
        }
      } else {
        callbackMap[key] = [{ id, callback }]
      }
    },
    off(key: string, id: string) {
      if (!Array.isArray(callbackMap[key])) {
        return // nothing to do
      }
      const index = callbackMap[key].findIndex((item) => item.id === id)
      if (index >= 0) {
        callbackMap[key].splice(index, 1)
      }
    },
  }

  return (
    <KeyboardContext.Provider value={controller}>
      {children}
    </KeyboardContext.Provider>
  )
}

export function useKeyboard() {
  const keyboard = useContext(KeyboardContext)

  if (keyboard === null) {
    throw new Error('useKeyboard cannot be used outside of KeyboardProvider')
  }

  return keyboard
}
