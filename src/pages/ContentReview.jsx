import { useEffect, useState, useRef, Fragment } from "react"

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

  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const ResizableTH = ({
  children,
  columnKey,
  widths,
  setWidths,
  defaultWidth
}) => {
  const ref = useRef(null)

  const startResize = e => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = ref.current.offsetWidth

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const onMouseMove = e => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX))
      setWidths(prev => ({ ...prev, [columnKey]: newWidth }))
    }

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  return (
    <th
      ref={ref}
      style={{
        width: widths[columnKey] || defaultWidth,
        minWidth: 80
      }}
    >
      {children}
      <div className="col-resizer" onMouseDown={startResize} />
    </th>
  )
}

export default function Content() {
  const [rows, setRows] = useState([])
  const [expanded, setExpanded] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [widths, setWidths] = useState({})

  const defaultWidths = {
    id: 90,
    execution: 120,
    title: 300,
    status: 120,
    type: 120,
    category: 150,
    created: 140,
    actions: 140
  }

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`${API}/content-reviews`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    const data = await res.json()
    setRows(data)
    setLoading(false)
  }

  const toggleExpand = id =>
    setExpanded(e => ({ ...e, [id]: !e[id] }))

  const startEdit = row => {
    setEditingId(row.id)
    setEditForm({
      title: row.title || "",
      short_description: row.short_description || "",
      message: row.message || "",
      status: row.status || "",
      type: row.type || "",
      sub_type: row.sub_type || "",
      category: row.category || "",
      sub_category: row.sub_category || "",
      image_url: row.image_url || "",
      image_prompt: row.image_prompt || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const saveEdit = async id => {
    try {
      const res = await fetch(`${API}/content-reviews/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) throw new Error("Failed to update")

      const updated = await res.json()

      setRows(prev =>
        prev.map(r => (r.id === id ? updated : r))
      )

      setEditingId(null)
    } catch (err) {
      alert("Error updating item")
      console.error(err)
    }
  }

  // ✅ NUEVO BOTÓN DONE
  const markAsDone = async id => {
    try {
      const res = await fetch(`${API}/content-reviews/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "DONE" }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      const updated = await res.json()

      setRows(prev =>
        prev.map(r => (r.id === id ? updated : r))
      )
    } catch (err) {
      alert("Error updating status")
      console.error(err)
    }
  }

  const deleteRow = async id => {
    if (!window.confirm("Delete this item?")) return
    await fetch(`${API}/content-reviews/${id}`, {
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
              <th style={{ width: 40 }} />
              <ResizableTH columnKey="id" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.id}>ID</ResizableTH>
              <ResizableTH columnKey="execution" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.execution}>Execution</ResizableTH>
              <ResizableTH columnKey="title" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.title}>Title</ResizableTH>
              <ResizableTH columnKey="status" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.status}>Status</ResizableTH>
              <ResizableTH columnKey="type" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.type}>Type</ResizableTH>
              <ResizableTH columnKey="category" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.category}>Category</ResizableTH>
              <ResizableTH columnKey="created" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.created}>Created</ResizableTH>
              <ResizableTH columnKey="actions" widths={widths} setWidths={setWidths} defaultWidth={defaultWidths.actions}>Actions</ResizableTH>
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
                      <button className="btn-expand" onClick={() => toggleExpand(row.id)}>
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

                    <td>
                      {!editing ? (
                        <>
                          {row.status !== "DONE" && (
                            <button
                              className="btn-icon success"
                              title="Mark as DONE"
                              onClick={() => markAsDone(row.id)}
                            >
                              ✅
                            </button>
                          )}

                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() => startEdit(row)}
                          >
                            ✏️
                          </button>

                          <button
                            className="btn-icon danger"
                            title="Delete"
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
                          </>
                        ) : (
                          <div className="editor">
                            <input value={editForm.title} onChange={e => handleChange("title", e.target.value)} placeholder="Title" />
                            <input value={editForm.short_description} onChange={e => handleChange("short_description", e.target.value)} placeholder="Short Description" />
                            <textarea value={editForm.message} onChange={e => handleChange("message", e.target.value)} placeholder="Message" />
                            <input value={editForm.status} onChange={e => handleChange("status", e.target.value)} placeholder="Status" />
                            <input value={editForm.type} onChange={e => handleChange("type", e.target.value)} placeholder="Type" />
                            <input value={editForm.category} onChange={e => handleChange("category", e.target.value)} placeholder="Category" />
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