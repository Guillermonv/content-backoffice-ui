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
  return new Date(d).toLocaleDateString()
}

/* ==========================
   Reusable Resizable Header
========================== */
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

  /* 👇 column widths state (no persistence) */
  const [widths, setWidths] = useState({})

  const defaultWidths = {
    id: 90,
    execution: 120,
    title: 300,
    status: 120,
    type: 120,
    category: 150,
    created: 140,
    actions: 120
  }

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

                    <td style={{ width: widths.id || defaultWidths.id }}>{row.id}</td>
                    <td style={{ width: widths.execution || defaultWidths.execution }}>{row.execution_id}</td>
                    <td style={{ width: widths.title || defaultWidths.title }}>{row.title}</td>
                    <td style={{ width: widths.status || defaultWidths.status }}>
                      <span className={statusClass(row.status)}>
                        {row.status || "PENDING"}
                      </span>
                    </td>
                    <td style={{ width: widths.type || defaultWidths.type }}>{row.type || "—"}</td>
                    <td style={{ width: widths.category || defaultWidths.category }}>{row.category || "—"}</td>
                    <td style={{ width: widths.created || defaultWidths.created }}>{formatDate(row.created)}</td>

                    <td style={{ width: widths.actions || defaultWidths.actions }} className="col-order">
                      {!editing ? (
                        <>
                          <button className="btn-icon" onClick={() => startEdit(row)}>✏️</button>
                          <button className="btn-icon danger" onClick={() => deleteRow(row.id)}>🗑️</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-icon success" onClick={() => saveEdit(row.id)}>✔️</button>
                          <button className="btn-icon" onClick={cancelEdit}>✖️</button>
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
                            {/* editor igual que antes */}
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