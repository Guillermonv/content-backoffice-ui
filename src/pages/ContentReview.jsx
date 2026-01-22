import { useEffect, useState, Fragment } from "react"

const API = import.meta.env.VITE_API_BASE_URL
const TOKEN = import.meta.env.VITE_API_TOKEN

const statusClass = status => {
  if (!status) return "status status-yellow"
  const s = status.toLowerCase()
  if (["error", "failed"].includes(s)) return "status status-red"
  if (["done", "success", "approved"].includes(s)) return "status status-green"
  return "status status-yellow"
}

const formatDate = d => {
  if (!d || d.startsWith("0001")) return "—"
  return new Date(d).toLocaleDateString()
}

export default function Content() {
  const [rows, setRows] = useState([])
  const [expanded, setExpanded] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`${API}/content-reviews`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    setRows(await res.json())
    setLoading(false)
  }

  const toggleExpand = id =>
    setExpanded(e => ({ ...e, [id]: !e[id] }))

  const startEdit = row => {
    setEditingId(row.id)
    setEditForm({ ...row })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async id => {
    await fetch(`${API}/n/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editForm),
    })
    await load()
    setEditingId(null)
  }

  const deleteRow = async id => {
    if (!window.confirm("Delete this item?")) return
    await fetch(`${API}/n/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    setRows(r => r.filter(x => x.id !== id))
  }

  return (
    <div className="steps-page">
      <div className="page-header">
        <h1>Content Review</h1>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>Execution</th>
              <th>Title</th>
              <th>Status</th>
              <th>Type</th>
              <th>Category</th>
              <th>Created</th>
              <th className="col-order">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(row => {
              const isExpanded = expanded[row.id]
              const editing = editingId === row.id

              return (
                <Fragment key={row.id}>
                  <tr className={editing ? "active" : ""}>
                    <td className="cell-center">
                      <button
                        className="btn-expand"
                        onClick={() => toggleExpand(row.id)}
                      >
                        {isExpanded ? "▾" : "▸"}
                      </button>
                    </td>
                    <td>{row.id}</td>
                    <td>{row.execution_id}</td>
                    <td>{row.title}</td>
                    <td>
                      <span className={statusClass(row.status)}>
                        {row.status || "PENDING"}
                      </span>
                    </td>
                    <td>{row.type || "—"}</td>
                    <td>{row.category || "—"}</td>
                    <td>{formatDate(row.created)}</td>
                    <td className="col-order">
                      {!editing ? (
                        <>
                          <button
                            className="btn-icon"
                            onClick={() => startEdit(row)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => deleteRow(row.id)}
                          >
                            🗑️
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-icon success"
                            onClick={() => saveEdit(row.id)}
                          >
                            ✔️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={cancelEdit}
                          >
                            ✖️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="execution-expanded indent-bar-deep">
                      <td colSpan={9}>
                        {!editing ? (
                          <>
                            <strong>{row.short_description}</strong>
                            <p style={{ whiteSpace: "pre-wrap" }}>
                              {row.message}
                            </p>

                            {row.image_url && (
                              <img
                                src={row.image_url}
                                alt=""
                                style={{
                                  maxWidth: "100%",
                                  borderRadius: 8,
                                  marginTop: 12,
                                }}
                              />
                            )}

                            <div className="meta">
                              <b>SubType:</b> {row.sub_type || "—"} ·{" "}
                              <b>SubCategory:</b> {row.sub_category || "—"}
                            </div>
                          </>
                        ) : (
                          <div className="editor">
                            <label>Title</label>
                            <input
                              value={editForm.title || ""}
                              onChange={e =>
                                setEditForm({ ...editForm, title: e.target.value })
                              }
                            />

                            <label>Short Description</label>
                            <input
                              value={editForm.short_description || ""}
                              onChange={e =>
                                setEditForm({
                                  ...editForm,
                                  short_description: e.target.value,
                                })
                              }
                            />

                            <label>Message</label>
                            <textarea
                              rows={6}
                              value={editForm.message || ""}
                              onChange={e =>
                                setEditForm({
                                  ...editForm,
                                  message: e.target.value,
                                })
                              }
                            />

                            <label>Status</label>
                            <select
                              value={editForm.status || ""}
                              onChange={e =>
                                setEditForm({
                                  ...editForm,
                                  status: e.target.value,
                                })
                              }
                            >
                              <option value="initiated">Initiated</option>
                              <option value="approved">Approved</option>
                              <option value="failed">Failed</option>
                              <option value="done">Done</option>
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
