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
            <td className="w-32">c</td>
            <td>
              Mute <strong>c</strong>lick track
            </td>
          </tr>

          <tr>
            <td className="w-32">0-9</td>
            <td>Select track</td>
          </tr>

          <tr>
            <td colSpan={2}>
              <em>After selecting track</em>
            </td>
          </tr>

          <tr>
            <td className="w-32">r</td>
            <td>
              Arm <strong>r</strong>ecording
            </td>
          </tr>

          <tr>
            <td className="w-32">i</td>
            <td>
              Monitor <strong>i</strong>nput
            </td>
          </tr>

          <tr>
            <td className="w-32">m</td>
            <td>
              <strong>M</strong>ute track
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
