type Props = {
  children: React.ReactNode
}
// This component was part of an earlier design iteration.
// It should be removed eventually if its just a div
export function ControlPanelItem(props: Props) {
  return <div className="mr-4">{props.children}</div>
}
