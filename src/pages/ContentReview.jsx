import React, { useEffect, useState, useRef, Fragment } from "react"

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
  return new Date(d).toLocaleString()
}

/* ================= RESIZABLE ================= */
const ResizableTH = ({ children, columnKey, widths, setWidths, defaultWidth }) => {
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
    <th ref={ref} style={{ width: widths[columnKey] || defaultWidth, minWidth: 80 }}>
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

  /* PAGINATION */
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  /* FILTERS */
  const [statusFilter, setStatusFilter] = useState("")
  const [executionFilter, setExecutionFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [widths, setWidths] = useState({})

  const defaultWidths = {
    id: 90,
    execution: 120,
    title: 300,
    status: 120,
    type: 120,
    category: 150,
    created: 180,
    actions: 160
  }

  const toggleExpand = id =>
    setExpanded(e => ({ ...e, [id]: !e[id] }))

  /* ================= LOAD ================= */
  const load = async () => {
    setLoading(true)

    const params = new URLSearchParams()
    params.append("page", page)
    params.append("limit", limit)

    if (statusFilter) params.append("status", statusFilter)
    if (executionFilter) params.append("execution_id", executionFilter)
    if (categoryFilter) params.append("category", categoryFilter)
    if (fromDate) params.append("from", fromDate)
    if (toDate) params.append("to", toDate)

    const res = await fetch(
      `${API}/content-reviews?${params.toString()}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    )

    const json = await res.json()

    setRows(json.data || [])
    setTotalPages(json.pagination?.totalPages || 1)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, limit, statusFilter, executionFilter, categoryFilter, fromDate, toDate])

  /* ================= EDIT ================= */
  const startEdit = row => {
    setEditingId(row.id)
    setEditForm({
      title: row.title || "",
      short_description: row.short_description || "",
      message: row.message || "",
      status: row.status || "",
      type: row.type || "",
      category: row.category || ""
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleChange = (field, value) =>
    setEditForm(prev => ({ ...prev, [field]: value }))

  const saveEdit = async id => {
    const res = await fetch(`${API}/content-reviews/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(editForm)
    })

    const updated = await res.json()

    setRows(prev => prev.map(r => (r.id === id ? updated : r)))
    setEditingId(null)
  }

  const markAsDone = async id => {
    const res = await fetch(`${API}/content-reviews/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "DONE" })
    })

    const updated = await res.json()

    setRows(prev => prev.map(r => (r.id === id ? updated : r)))
  }

  const deleteRow = async id => {
    if (!window.confirm("Delete this item?")) return
    await fetch(`${API}/content-reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
    setRows(r => r.filter(x => x.id !== id))
  }

  /* PAGINATION CONTROLS */
  const goFirst = () => setPage(1)
  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))
  const goLast = () => setPage(totalPages)

  return (
    <div className="steps-page">
      <h1>Content Review</h1>

      {/* HEADER */}
      <div className="steps-header">

        {/* LEFT FILTERS */}
        <div className="steps-header-left">
          <div className="header-group">

            <select
              className="select-primary"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Status</option>
              <option value="DONE">DONE</option>
              <option value="ERROR">ERROR</option>
              <option value="PENDING">PENDING</option>
            </select>

            <input
              type="number"
              placeholder="Execution ID"
              className="filter-input"
              value={executionFilter}
              onChange={e => { setExecutionFilter(e.target.value); setPage(1) }}
            />

            <input
              type="text"
              placeholder="Category"
              className="filter-input"
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            />

          </div>
        </div>

        {/* RIGHT PAGINATION */}
        <div className="pagination-box">

          <div className="header-group">
            <input type="date" className="filter-input" value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }} />
            <input type="date" className="filter-input" value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1) }} />
          </div>

          <select value={limit}
            onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
            style={{ width: 60,height:32 }}>
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button className="btn-primary" onClick={goFirst} disabled={page === 1}>«</button>
          <button className="btn-primary" onClick={goPrev} disabled={page === 1}>‹</button>
          <button className="btn-primary" onClick={goNext} disabled={page === totalPages}>›</button>
          <button className="btn-primary" onClick={goLast} disabled={page === totalPages}>»</button>

          <span className="page-info" style={{ marginLeft: 16 }}>
            {page} / {totalPages}
          </span>
        </div>
      </div>

      {/* TABLE */}
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
              const open = expanded[row.id]
              const editing = editingId === row.id

              return (
                <Fragment key={row.id}>
                  <tr className={editing ? "active" : ""}>
                    <td>
                      <button className="btn-expand" onClick={() => toggleExpand(row.id)}>
                        {open ? "▾" : "▸"}
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
                            <button className="btn-icon success" onClick={() => markAsDone(row.id)}>✅</button>
                          )}
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

                  {open && (
                    <tr>
                      <td colSpan={9} className="execution-expanded indent-bar-deep">
                        {!editing ? (
                          <>
                            <strong>{row.short_description}</strong>
                            <p style={{ whiteSpace: "pre-wrap" }}>{row.message}</p>
                          </>
                        ) : (
                          <div className="editor">
                            <input value={editForm.title} onChange={e => handleChange("title", e.target.value)} />
                            <input value={editForm.short_description} onChange={e => handleChange("short_description", e.target.value)} />
                            <textarea value={editForm.message} onChange={e => handleChange("message", e.target.value)} />
                            <input value={editForm.status} onChange={e => handleChange("status", e.target.value)} />
                            <input value={editForm.type} onChange={e => handleChange("type", e.target.value)} />
                            <input value={editForm.category} onChange={e => handleChange("category", e.target.value)} />
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