
import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_BASE_URL
const TOKEN = import.meta.env.VITE_API_TOKEN

export default function Steps() {
  const [steps, setSteps] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch(`${API}/steps`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
      .then(r => r.json())
      .then(setSteps)
  }, [])

  const save = async () => {
    await fetch(`${API}/steps/${selected.ID}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(selected)
    })
    alert("Updated")
  }

  return (
    <div>
      <h1>Steps</h1>

      <table className="table">
  <thead>
    <tr>
      <th className="col-id">ID</th>
      <th className="col-name">Name</th>
      <th className="col-order">Order</th>
    </tr>
  </thead>
  <tbody>
    {steps.map(s => (
      <tr
        key={s.ID}
        className={selected?.ID === s.ID ? "active" : ""}
        onClick={() => setSelected({ ...s })}
      >
        <td className="col-id">{s.ID}</td>
        <td className="col-name">{s.Name}</td>
        <td className="col-order">{s.OrderIndex}</td>
      </tr>
    ))}
  </tbody>
</table>


      {selected && (
        <section className="editor">
          <h3>Edit Step #{selected.ID}</h3>

          <label>Name</label>
          <input
            value={selected.Name}
            onChange={e => setSelected({ ...selected, Name: e.target.value })}
          />

          <label>Prompt</label>
          <textarea
            rows="8"
            value={selected.Prompt}
            onChange={e => setSelected({ ...selected, Prompt: e.target.value })}
          />

          <button onClick={save}>Save</button>
        </section>
      )}
    </div>
  )
}
