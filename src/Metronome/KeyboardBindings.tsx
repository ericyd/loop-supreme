export default function KeyboardBindings() {
  return (
    <div>
      <h2 className="text-xl mb-8 mt-16">Keyboard controls</h2>
      <table className="">
        <thead>
          <tr>
            <th className="text-left">Key</th>
            <th className="text-left">Binding</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="w-32">Space</td>
            <td>Play / pause</td>
          </tr>

          <tr>
            <td className="w-32">m</td>
            <td>Mute metronome</td>
          </tr>

          <tr>
            <td className="w-32">0-9</td>
            <td>Select track</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
