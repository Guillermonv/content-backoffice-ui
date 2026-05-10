import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const startResize = (th) => (e) => {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = th.offsetWidth
  const onMouseMove = (e) => {
    const newWidth = Math.max(60, startWidth + (e.clientX - startX))
    th.style.width = `${newWidth}px`
  }
  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
  }
  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)
}

const ResizableTH = ({ children, style }) => (
  <th style={style}>
    {children}
    <div className="col-resizer" onMouseDown={(e) => startResize(e.currentTarget.parentElement)(e)} />
  </th>
)

export default function Agents() {
  const { apiFetch } = useAuth()
  const [agents, setAgents] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    Provider: "",
    Secret: "",
  })

  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    Provider: "",
    Secret: "",
  })

  // ======================
  // Load agents
  // ======================
  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    const res = await apiFetch(`${API_BASE_URL}/agents`)
    if (!res) return
    setAgents(await res.json())
  }

  // ======================
  // Edit
  // ======================
  const startEdit = (agent) => {
    setEditingId(agent.ID)
    setEditForm({
      Provider: agent.Provider || "",
      Secret: agent.Secret || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id) => {
    await apiFetch(`${API_BASE_URL}/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Provider: editForm.Provider,
        Secret: editForm.Secret,
      }),
    })

    await loadAgents()
    setEditingId(null)
  }

  // ======================
  // Create
  // ======================
  const startCreate = () => {
    setCreating(true)
    setCreateForm({ Provider: "", Secret: "" })
  }

  const cancelCreate = () => {
    setCreating(false)
  }

  const saveCreate = async () => {
    if (!createForm.Provider) return

    await apiFetch(`${API_BASE_URL}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Provider: createForm.Provider,
        Secret: createForm.Secret,
      }),
    })

    await loadAgents()
    setCreating(false)
  }

  // ======================
  // Delete
  // ======================
  const deleteAgent = async (id) => {
    const ok = window.confirm("Delete this agent?")
    if (!ok) return

    await apiFetch(`${API_BASE_URL}/agents/${id}`, { method: "DELETE" })

    setAgents((prev) => prev.filter((a) => a.ID !== id))
  }

  return (
    <div>
      {/* ====================== */}
      {/* Header */}
      {/* ====================== */}
      <div className="page-header">
        <h1>Agents</h1>
        {!creating && (
          <button onClick={startCreate} className="btn-primary">
            + Add agent
          </button>
        )}
      </div>

      {creating && (
        <div className="editor">
          <label>Provider</label>
          <input
            value={createForm.Provider}
            onChange={(e) =>
              setCreateForm({ ...createForm, Provider: e.target.value })
            }
          />

          <label>Secret</label>
          <input
            value={createForm.Secret}
            onChange={(e) =>
              setCreateForm({ ...createForm, Secret: e.target.value })
            }
          />

          <div>
            <button onClick={saveCreate} className="btn-icon success">
              ✔️ Save
            </button>
            <button onClick={cancelCreate} className="btn-icon">
              ✖️ Cancel
            </button>
          </div>
        </div>
      )}

      {/* ====================== */}
      {/* Table */}
      {/* ====================== */}
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <ResizableTH style={{ width: "80px" }}>ID</ResizableTH>
            <ResizableTH style={{ width: "200px" }}>Provider</ResizableTH>
            <ResizableTH style={{ width: "200px" }}>Secret</ResizableTH>
            <ResizableTH style={{ width: "100px" }}>Actions</ResizableTH>
          </tr>
        </thead>

        <tbody>
          {agents.map((a) => {
            const editing = editingId === a.ID

            return (
              <tr key={a.ID} className={editing ? "active" : ""}>
                <td className="col-id">{a.ID}</td>

                <td className="col-name">
                  {editing ? (
                    <input
                      value={editForm.Provider}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          Provider: e.target.value,
                        })
                      }
                    />
                  ) : (
                    a.Provider
                  )}
                </td>

                <td className="col-name">
                  {editing ? (
                    <input
                      value={editForm.Secret}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          Secret: e.target.value,
                        })
                      }
                    />
                  ) : a.Secret ? (
                    "••••••••••"
                  ) : (
                    ""
                  )}
                </td>

                <td className="col-order">
                  {!editing ? (
                    <>
                      <button
                        onClick={() => startEdit(a)}
                        className="btn-icon"
                        title="Edit"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => deleteAgent(a.ID)}
                        className="btn-icon danger"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => saveEdit(a.ID)}
                        className="btn-icon success"
                        title="Save"
                      >
                        ✔️
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="btn-icon"
                        title="Cancel"
                      >
                        ✖️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
