import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// ======================
// Column resize helper
// ======================
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

export default function Workflows() {
  const { apiFetch } = useAuth()
  const [workflows, setWorkflows] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    Name: "",
    Description: "",
    Enabled: false,
  })

  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    Name: "",
    Description: "",
    Enabled: true,
  })

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    const res = await apiFetch(`${API_BASE_URL}/workflows`)
    if (!res) return
    setWorkflows(await res.json())
  }

  // ======================
  // Toggle Enabled
  // ======================
  const toggleEnabled = async (w) => {
    const newValue = !w.Enabled

    // Optimistic update
    setWorkflows((prev) =>
      prev.map((item) =>
        item.ID === w.ID ? { ...item, Enabled: newValue } : item
      )
    )

    await apiFetch(`${API_BASE_URL}/workflows/${w.ID}/enabled`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newValue }),
    })
  }

  // ======================
  // Edit
  // ======================
  const startEdit = (w) => {
    setEditingId(w.ID)
    setEditForm({
      Name: w.Name || "",
      Description: w.Description || "",
      Enabled: w.Enabled || false,
    })
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id) => {
    await apiFetch(`${API_BASE_URL}/workflows/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: editForm.Name,
        Description: editForm.Description,
        Enabled: editForm.Enabled,
      }),
    })

    await loadWorkflows()
    setEditingId(null)
  }

  // ======================
  // Create
  // ======================
  const startCreate = () => {
    setCreating(true)
    setCreateForm({ Name: "", Description: "", Enabled: true })
  }

  const cancelCreate = () => setCreating(false)

  const saveCreate = async () => {
    if (!createForm.Name) return

    await apiFetch(`${API_BASE_URL}/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })

    await loadWorkflows()
    setCreating(false)
  }

  // ======================
  // Delete
  // ======================
  const deleteWorkflow = async (id) => {
    const ok = window.confirm("Delete this workflow?")
    if (!ok) return

    await apiFetch(`${API_BASE_URL}/workflows/${id}`, { method: "DELETE" })

    setWorkflows((prev) => prev.filter((w) => w.ID !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h1>Workflows</h1>
        {!creating && (
          <button onClick={startCreate} className="btn-primary">
            + Add workflow
          </button>
        )}
      </div>

      {creating && (
        <div className="editor">
          <label>Name</label>
          <input
            value={createForm.Name}
            onChange={(e) =>
              setCreateForm({ ...createForm, Name: e.target.value })
            }
          />

          <label>Description</label>
          <input
            value={createForm.Description}
            onChange={(e) =>
              setCreateForm({ ...createForm, Description: e.target.value })
            }
          />

          <label>
            <input
              type="checkbox"
              checked={createForm.Enabled}
              onChange={(e) =>
                setCreateForm({ ...createForm, Enabled: e.target.checked })
              }
            />
            Enabled
          </label>

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

      <table className="table">
        <thead>
          <tr>
            <ResizableTH style={{ width: "70px" }}>ID</ResizableTH>
            <ResizableTH style={{ width: "180px" }}>Name</ResizableTH>
            <ResizableTH style={{ width: "420px" }}>Description</ResizableTH>
            <ResizableTH style={{ width: "150px" }}>Status</ResizableTH>
            <ResizableTH style={{ width: "130px" }}>Actions</ResizableTH>
          </tr>
        </thead>

        <tbody>
          {workflows.map((w) => {
            const editing = editingId === w.ID

            return (
              <tr key={w.ID} className={editing ? "active" : ""}>
                <td>{w.ID}</td>

                <td>
                  {editing ? (
                    <input
                      value={editForm.Name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, Name: e.target.value })
                      }
                    />
                  ) : (
                    w.Name
                  )}
                </td>

                <td>
                  {editing ? (
                    <input
                      value={editForm.Description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          Description: e.target.value,
                        })
                      }
                    />
                  ) : (
                    w.Description
                  )}
                </td>

                <td>
                  <div className="cell-center">
                    <span className={w.Enabled ? "badge-enabled" : "badge-disabled"}>
                      {w.Enabled ? "Enabled" : "Disabled"}
                    </span>

                    {!editing && (
                      <button
                        onClick={() => toggleEnabled(w)}
                        className="btn-icon"
                        title="Toggle status"
                      >
                        🔄
                      </button>
                    )}

                    {editing && (
                      <input
                        type="checkbox"
                        checked={editForm.Enabled}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            Enabled: e.target.checked,
                          })
                        }
                      />
                    )}
                  </div>
                </td>

                <td>
                  {!editing ? (
                    <>
                      <button
                        onClick={() => startEdit(w)}
                        className="btn-icon"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => deleteWorkflow(w.ID)}
                        className="btn-icon danger"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => saveEdit(w.ID)}
                        className="btn-icon success"
                      >
                        ✔️
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="btn-icon"
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
  )
}