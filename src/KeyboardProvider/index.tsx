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
 *   keyboard.on('a', myFunction)
 * }
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { logger } from '../util/logger'

type KeyboardEventHandler = (event: KeyboardEvent) => void

type KeyboardController = {
  on(key: string, callback: KeyboardEventHandler): void
  off(key: string, callback: KeyboardEventHandler): void
}

const KeyboardContext = createContext<KeyboardController | null>(null)

type Props = {
  children: React.ReactNode
}

const noop = () => {}

export const KeyboardProvider: React.FC<Props> = ({ children }) => {
  // map of keys to callbacks.
  // this is extremely unsophisticated, and might need more complexity.
  // However, since these are all set explicitly in the code, it is OK for now
  const callbackMap: Record<string, KeyboardEventHandler> = useMemo(
    () => ({}),
    []
  )

  useEffect(() => {
    const keydownCallback = (e: KeyboardEvent) => {
      logger.debug({ key: e.key, meta: e.metaKey, shift: e.shiftKey })
      callbackMap[e.key]?.(e)
    }
    window.addEventListener('keydown', keydownCallback)
    return () => {
      window.removeEventListener('keydown', keydownCallback)
    }
  }, [callbackMap])

  const controller = {
    on(key: string, callback: KeyboardEventHandler) {
      callbackMap[key] = callback
    },
    off(key: string) {
      callbackMap[key] = noop
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
