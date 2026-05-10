import React, { useEffect, useState, Fragment } from "react"
import { useAuth } from "../context/AuthContext"

const API = import.meta.env.VITE_API_BASE_URL

const statusClass = status => {
  if (!status) return "status status-yellow"
  const s = status.toLowerCase()
  if (["error", "failed", "cancelled"].includes(s)) return "status status-red"
  if (["published", "success", "approved"].includes(s)) return "status status-green"
  return "status status-yellow"
}

const formatDate = d => {
  if (!d || d.startsWith("0001")) return "—"
  return new Date(d).toLocaleString()
}

/* ================= RESIZABLE ================= */
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

export default function Content() {
  const { apiFetch } = useAuth()
  const [rows, setRows] = useState([])
  const [expanded, setExpanded] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(true)

  /* SECTION MODAL */
  const [sectionModal, setSectionModal] = useState(null)
  const [sectionValue, setSectionValue] = useState("")

  /* PAGINATION */
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  /* FILTERS */
  const [statusFilter, setStatusFilter] = useState("")
  const [executionFilter, setExecutionFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

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
    if (fromDate) params.append("from", fromDate)
    if (toDate) params.append("to", toDate)

    const res = await apiFetch(`${API}/content-reviews?${params.toString()}`)
    if (!res) return

    const json = await res.json()

    setRows(prev => {
      const prevMap = new Map(prev.map(r => [r.id, r]))
      return (json.data || []).map(r => ({ ...prevMap.get(r.id), ...r }))
    })
    setTotalPages(json.pagination?.totalPages || 1)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [page, limit, statusFilter, executionFilter, fromDate, toDate])

  /* ================= EDIT ================= */
  const startEdit = row => {
    setEditingId(row.id)
    setEditForm({
      title: row.title || "",
      slug: row.slug || "",
      short_description: row.short_description || "",
      message: row.message || "",
      status: row.status || "",
      section: row.section ?? 0
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleChange = (field, value) =>
    setEditForm(prev => ({ ...prev, [field]: value }))

  const saveEdit = async id => {
    await apiFetch(`${API}/content-reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    })

    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...editForm } : r)))
    setEditingId(null)
  }

  const updateStatus = async (row, status) => {
    await apiFetch(`${API}/content-reviews/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, status })
    })
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, status } : r)))
  }

  const openSectionModal = row => {
    setSectionModal(row)
    setSectionValue(row.section ?? "")
  }

  const saveSection = async () => {
    const row = sectionModal
    const section = sectionValue === "" ? 0 : parseInt(sectionValue, 10)
    await apiFetch(`${API}/content-reviews/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, section })
    })
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, section } : r)))
    setSectionModal(null)
  }

  const deleteRow = async id => {
    if (!window.confirm("Delete this item?")) return
    await apiFetch(`${API}/content-reviews/${id}`, { method: "DELETE" })
    setRows(r => r.filter(x => x.id !== id))
  }

  const goFirst = () => setPage(1)
  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))
  const goLast = () => setPage(totalPages)

  return (
    <div className="steps-page">
      <h1>Content Review</h1>

      {/* ================= HEADER ================= */}
      <div className="steps-header">

        <div className="steps-header-left">
          <div className="header-group">

            <select
              className="select-primary"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ERROR">ERROR</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <input
              type="number"
              placeholder="Execution ID"
              className="filter-input"
              value={executionFilter}
              onChange={e => { setExecutionFilter(e.target.value); setPage(1) }}
            />

          </div>
        </div>

        <div className="pagination-box">

          <div className="header-group">
            <input type="date" className="filter-input"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }} />
            <input type="date" className="filter-input"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1) }} />
          </div>

          <select
            value={limit}
            onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
            className="page-select"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button className="btn-primary" onClick={goFirst} disabled={page === 1}>«</button>
          <button className="btn-primary" onClick={goPrev} disabled={page === 1}>‹</button>
          <button className="btn-primary" onClick={goNext} disabled={page === totalPages}>›</button>
          <button className="btn-primary" onClick={goLast} disabled={page === totalPages}>»</button>

          <span className="page-info">
            {page} / {totalPages}
          </span>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "40px" }} />
              <ResizableTH style={{ width: "90px" }}>ID</ResizableTH>
              <ResizableTH style={{ width: "120px" }}>Execution</ResizableTH>
              <ResizableTH style={{ width: "300px" }}>Title</ResizableTH>
              <ResizableTH style={{ width: "200px" }}>Slug</ResizableTH>
              <ResizableTH style={{ width: "120px" }}>Status</ResizableTH>
              <ResizableTH style={{ width: "160px" }}>Created</ResizableTH>
              <ResizableTH style={{ width: "80px" }}>Section</ResizableTH>
              <ResizableTH style={{ width: "160px" }}>Actions</ResizableTH>
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
                    <td>{row.slug || "—"}</td>
                    <td>
                      <span className={statusClass(row.status)}>
                        {row.status || "PENDING"}
                      </span>
                    </td>
                    <td>{formatDate(row.created)}</td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: row.section ? "var(--text)" : "var(--text-muted)" }}>
                      {row.section || "—"}
                    </td>

                    <td>
                      {!editing ? (
                        <>
                          {row.status !== "PUBLISHED" && (
                            <button className="btn-icon success" onClick={() => updateStatus(row, "PUBLISHED")}>✅</button>
                          )}
                          {row.status === "PUBLISHED" && (
                            <button className="btn-icon danger" onClick={() => updateStatus(row, "CANCELLED")}>🚫</button>
                          )}
                          <button className="btn-icon" title="Asignar sección" onClick={() => openSectionModal(row)}>📄</button>
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
                            <input value={editForm.slug} onChange={e => handleChange("slug", e.target.value)} />
                            <input value={editForm.short_description} onChange={e => handleChange("short_description", e.target.value)} />
                            <textarea value={editForm.message} onChange={e => handleChange("message", e.target.value)} />
                            <input value={editForm.status} onChange={e => handleChange("status", e.target.value)} />
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
        </div>
      )}

      {sectionModal && (
        <div className="modal-overlay" onClick={() => setSectionModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Asignar sección — #{sectionModal.id}</h3>
            <div className="modal-field">
              <label>Número de sección</label>
              <input
                autoFocus
                type="number"
                min="0"
                value={sectionValue}
                onChange={e => setSectionValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveSection(); if (e.key === "Escape") setSectionModal(null) }}
                placeholder="ej: 1, 2, 3…"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSectionModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveSection}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}