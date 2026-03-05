import React, { useEffect, useState, useRef } from "react"

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
    <th
      ref={ref}
      style={{ width: widths[columnKey] || defaultWidth, minWidth: 80 }}
    >
      {children}
      <div className="col-resizer" onMouseDown={startResize} />
    </th>
  )
}

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

  const [mainWidths, setMainWidths] = useState({})
  const [nestedWidths, setNestedWidths] = useState({})

  const defaultMain = {
    execution: 120,
    status: 120,
    workflow: 260,
    description: 350,
    created: 200
  }

  const defaultNested = {
    stepid: 100,
    name: 200,
    status: 120,
    output: 400
  }

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
            style={{ width: 60, height: 32, textAlign: "center" }}
          >
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
      {/* ================= TABLE ================= */}
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 40 }} />
            <ResizableTH columnKey="execution" widths={mainWidths} setWidths={setMainWidths} defaultWidth={defaultMain.execution}>Execution</ResizableTH>
            <ResizableTH columnKey="status" widths={mainWidths} setWidths={setMainWidths} defaultWidth={defaultMain.status}>Status</ResizableTH>
            <ResizableTH columnKey="workflow" widths={mainWidths} setWidths={setMainWidths} defaultWidth={defaultMain.workflow}>Workflow</ResizableTH>
            <ResizableTH columnKey="description" widths={mainWidths} setWidths={setMainWidths} defaultWidth={defaultMain.description}>Description</ResizableTH>
            <ResizableTH columnKey="created" widths={mainWidths} setWidths={setMainWidths} defaultWidth={defaultMain.created}>Created</ResizableTH>
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
                            <ResizableTH columnKey="stepid" widths={nestedWidths} setWidths={setNestedWidths} defaultWidth={defaultNested.stepid}>Step ID</ResizableTH>
                            <ResizableTH columnKey="name" widths={nestedWidths} setWidths={setNestedWidths} defaultWidth={defaultNested.name}>Name</ResizableTH>
                            <ResizableTH columnKey="status" widths={nestedWidths} setWidths={setNestedWidths} defaultWidth={defaultNested.status}>Status</ResizableTH>
                            <ResizableTH columnKey="output" widths={nestedWidths} setWidths={setNestedWidths} defaultWidth={defaultNested.output}>Output</ResizableTH>
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