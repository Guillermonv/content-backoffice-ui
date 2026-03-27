import React, { useEffect, useState } from "react"

const API = import.meta.env.VITE_API_BASE_URL
const TOKEN = import.meta.env.VITE_API_TOKEN

const statusClass = status => {
  if (!status) return "status status-yellow"
  const s = status.toLowerCase()
  if (s === "error" || s === "failed") return "status status-red"
  if (s === "done" || s === "success") return "status status-green"
  return "status status-yellow"
}

/* =====================
   ICONS
====================== */
const ExpandAllIcon = () => <span style={{ fontSize: 18 }}>⤵</span>
const CollapseAllIcon = () => <span style={{ fontSize: 18 }}>⤴</span>

/* =====================
   Resizable TH
====================== */
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

export default function Execution() {
  const [executions, setExecutions] = useState([])
  const [expanded, setExpanded] = useState({})
  const [expandedOutput, setExpandedOutput] = useState({})
  const [activeRow, setActiveRow] = useState(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const [statusFilter, setStatusFilter] = useState("")
  const [workflowFilter, setWorkflowFilter] = useState("")
  const [executionIdFilter, setExecutionIdFilter] = useState("")
  const [workflows, setWorkflows] = useState([])

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const toggle = id =>
    setExpanded(e => ({ ...e, [id]: !e[id] }))

  const toggleOutput = id =>
    setExpandedOutput(o => ({ ...o, [id]: !o[id] }))

  const expandAll = () => {
    const all = {}
    executions.forEach(e => {
      all[e.execution.id] = true
    })
    setExpanded(all)
  }

  const collapseAll = () => setExpanded({})

  /* ================= LOAD DATA ================= */

  const loadWorkflows = async () => {
    const res = await fetch(`${API}/workflows`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
    const json = await res.json()
    setWorkflows(json)
  }

  const load = async () => {
    const params = new URLSearchParams()
    params.append("page", page)
    params.append("pageSize", pageSize)

    if (statusFilter) params.append("status", statusFilter)
    if (workflowFilter) params.append("workflowId", workflowFilter)
    if (executionIdFilter) params.append("execution_id", executionIdFilter)

    if (fromDate)
      params.append("from", new Date(fromDate).toISOString())

    if (toDate) {
      const d = new Date(toDate)
      d.setHours(23, 59, 59)
      params.append("to", d.toISOString())
    }

    const res = await fetch(
      `${API}/step-executions-grouped?${params.toString()}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    )

    const json = await res.json()
    setExecutions(json.data)
    setTotalPages(json.pagination?.totalPages || 1)
  }

  useEffect(() => { loadWorkflows() }, [])

  useEffect(() => {
    load()
  }, [page, pageSize, statusFilter, workflowFilter, executionIdFilter, fromDate, toDate])

  const goFirst = () => setPage(1)
  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))
  const goLast = () => setPage(totalPages)

  return (
    <div className="steps-page">
      <h1>Executions</h1>

      {/* ================= HEADER ================= */}
      <div className="steps-header">

        <div className="steps-header-left">

          <div className="header-group">
            <button className="btn-expand" onClick={expandAll}>
              <ExpandAllIcon />
            </button>
            <button className="btn-expand" onClick={collapseAll}>
              <CollapseAllIcon />
            </button>
          </div>

          <div className="header-group">

            <select
              className="select-primary"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Status</option>
              <option value="DONE">DONE</option>
              <option value="ERROR">ERROR</option>
              <option value="MANUAL_REVIEW">MANUAL REVIEW</option>
            </select>

            <select
              className="select-primary"
              value={workflowFilter}
              onChange={e => { setWorkflowFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Workflows</option>
              {workflows.map(w => (
                <option key={w.ID} value={w.ID}>
                  {w.Name}
                </option>
              ))}
            </select>

            {/* 🔥 NUEVO FILTRO */}
            <input
              type="number"
              placeholder="Execution ID"
              className="filter-input"
              value={executionIdFilter}
              onChange={e => {
                setExecutionIdFilter(e.target.value)
                setPage(1)
              }}
              style={{ width: 140 }}
            />

          </div>
        </div>

        {/* RIGHT SIDE PAGINATION */}
        <div className="pagination-box">
          <div className="header-group">
            <input
              type="date"
              className="filter-input"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }}
            />
            <input
              type="date"
              className="filter-input"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1) }}
            />
          </div>

          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
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
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: "40px" }} />
            <ResizableTH style={{ width: "120px" }}>Execution</ResizableTH>
            <ResizableTH style={{ width: "120px" }}>Status</ResizableTH>
            <ResizableTH style={{ width: "260px" }}>Workflow</ResizableTH>
            <ResizableTH style={{ width: "350px" }}>Description</ResizableTH>
            <ResizableTH style={{ width: "200px" }}>Created</ResizableTH>
          </tr>
        </thead>

        <tbody>
          {executions.map(e => {
            const exec = e.execution
            const open = expanded[exec.id]

            return (
              <React.Fragment key={exec.id}>
                <tr
                  className={activeRow === exec.id ? "active" : ""}
                  onClick={() => setActiveRow(exec.id)}
                >
                  <td>
                    <button className="btn-expand" onClick={() => toggle(exec.id)}>
                      {open ? "▾" : "▸"}
                    </button>
                  </td>
                  <td>{exec.id}</td>
                  <td>
                    <span className={statusClass(exec.status)}>
                      {exec.status}
                    </span>
                  </td>
                  <td>{exec.workflow?.name}</td>
                  <td>{exec.workflow?.description}</td>
                  <td>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>

                {open && (
                  <tr>
                    <td colSpan={6} className="execution-expanded indent-bar-deep">
                      <table className="table">
                        <thead>
                          <tr>
                            <ResizableTH style={{ width: "100px" }}>Step ID</ResizableTH>
                            <ResizableTH style={{ width: "200px" }}>Name</ResizableTH>
                            <ResizableTH style={{ width: "120px" }}>Status</ResizableTH>
                            <ResizableTH style={{ width: "400px" }}>Output</ResizableTH>
                          </tr>
                        </thead>
                        <tbody>
                          {e.steps?.map(s => (
                            <tr key={s.id}>
                              <td>{s.step_id}</td>
                              <td>{s.step?.Name}</td>
                              <td>
                                <span className={statusClass(s.status)}>
                                  {s.status}
                                </span>
                              </td>
                              <td>
                                <pre
                                  style={{ cursor: "pointer" }}
                                  onClick={() => toggleOutput(s.id)}
                                >
                                  {expandedOutput[s.id]
                                    ? s.output
                                    : s.output?.slice(0, 300)}
                                </pre>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}