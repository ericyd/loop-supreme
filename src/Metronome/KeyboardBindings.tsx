/**
 * This is a simple display input,
 * to inform users how to use keyboard bindings.
 */

const globalKeyBindings = {
  space: 'Play / pause',
  c: 'Mute click track',
  '0-9': 'Select track',
}

const trackKeyBindings = {
  r: 'Arm for recording',
  m: 'Mute track',
  i: 'Monitor input',
}

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
          {Object.entries(globalKeyBindings).map(([key, action]) => (
            <tr>
              <td className="w-32">{key}</td>
              <td>{action}</td>
            </tr>
          ))}

          <tr>
            <td colSpan={2}>
              <em>After selecting track</em>
            </td>
          </tr>

          {Object.entries(trackKeyBindings).map(([key, action]) => (
            <tr>
              <td className="w-32">{key}</td>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}