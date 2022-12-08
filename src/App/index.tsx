import { AudioProvider } from '../AudioProvider'
import { Clock } from '../Clock'
import { useKeybindings } from '../hooks/use-keybindings'
import { KeyboardBindingsList } from './KeyboardBindingsList'

type Props = {
  defaultDeviceId: string
  audioContext: AudioContext
  devices: MediaDeviceInfo[]
}

function App(props: Props) {
  useKeybindings({
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
  })
  return (
    <AudioProvider {...props}>
      <Clock />
      <KeyboardBindingsList />
    </AudioProvider>
  )
}

export default App
