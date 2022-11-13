type Props = {
  children: React.ReactNode
}
export default function ControlPanelItem(props: Props) {
  return (
    <div className="p-2 border border-zinc-400 border-solid rounded-sm flex-grow mr-2">
      {props.children}
    </div>
  )
}
