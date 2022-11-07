type Props = {
  title: string
  children: React.ReactNode
}

export const Container: React.FC<Props> = (props) => {
  return (
    <div className="border border-zinc-400 border-solid rounded-sm mb-6">
      <h2 className="font-bold text-xl font-serif border-b border-r border-zinc-400 rounded-sm inline-block p-2">
        {props.title}
      </h2>
      <div className="p-2">{props.children}</div>
    </div>
  )
}
