import { useEffect, memo } from 'react'
import { logger } from '../util/logger'

type KeyboardEventHandler = (event: KeyboardEvent) => void
type IgnorableTagName = 'INPUT' | 'SELECT' | 'BUTTON'
type KeyBinding = {
  callback: KeyboardEventHandler
  tagIgnoreList?: Array<IgnorableTagName>
}
type CallbackMap = Record<string, KeyBinding>

type Props = {
  bindings: CallbackMap
}

const Component: React.FC<Props> = ({ bindings }) => {
  useEffect(() => {
    logger.debug({ bindings })
    const keydownCallback = (e: KeyboardEvent) => {
      logger.debug({ key: e.key, meta: e.metaKey, shift: e.shiftKey })

      const binding = bindings[e.key]
      if (
        binding &&
        !(binding?.tagIgnoreList ?? ['INPUT']).includes(
          (document.activeElement?.tagName as IgnorableTagName) ?? ''
        )
      ) {
        binding?.callback(e)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', keydownCallback)
    return () => {
      window.removeEventListener('keydown', keydownCallback)
    }
  }, [bindings])
  return null
}

export const KeyBindings = memo(Component)
