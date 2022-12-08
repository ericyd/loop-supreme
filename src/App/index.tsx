import { AudioProvider } from '../AudioProvider'
import { Clock } from '../Clock'
import { KeyBindings } from '../KeyBindings'
import { KeyboardBindingsList } from './KeyboardBindingsList'

type Props = {
  stream: MediaStream
  audioContext: AudioContext
}

function App(props: Props) {
  return (
    <AudioProvider {...props}>
      <Clock />
      <KeyboardBindingsList />
      <KeyBindings
        bindings={{
          Escape: {
            callback: () => {
              // @ts-expect-error this is totally valid, not sure why TS doesn't think so
              const maybeFn = document.activeElement?.blur?.bind(
                document.activeElement
              )
              console.log(maybeFn)
              if (typeof maybeFn === 'function') {
                maybeFn()
              }
            },
            tagIgnoreList: [],
          },
        }}
      />
    </AudioProvider>
  )
}

export default App
