import { useEffect, useState } from "react"

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
   Column resize helper
====================== */
const startResize = th => e => {
  e.preventDefault()

  const startX = e.clientX
  const startWidth = th.offsetWidth

  const onMouseMove = e => {
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

/* ======================
   Resizable TH
====================== */
const ResizableTH = ({ children, style }) => (
  <th
    style={{
      position: "relative",
      whiteSpace: "nowrap",
      ...style
    }}
  >
    {children}
    <div
      onMouseDown={e =>
        startResize(e.currentTarget.parentElement)(e)
      }
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: 6,
        height: "100%",
        cursor: "col-resize",
        userSelect: "none"
      }}
    />
  </th>
)

/* ======================
   Icons
====================== */
const ExpandAllIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
    <path d="M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6" />
  </svg>
)

const CollapseAllIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M9 9H3V3M15 9h6V3M9 15H3v6M15 15h6v6" />
    <path d="M9 9l-6-6M15 9l6-6M9 15l-6 6M15 15l6 6" />
  </svg>
)

export default function Execution() {
  const [executions, setExecutions] = useState([])
  const [expanded, setExpanded] = useState({})
  const [expandedOutput, setExpandedOutput] = useState({})

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // filtros
  const [status, setStatus] = useState("")
  const [workflowName, setWorkflowName] = useState("")

  // 🔥 paginación
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const load = async () => {
    setPage(1)

    const params = new URLSearchParams()

    if (fromDate) {
      params.append("from", new Date(fromDate).toISOString())
    }

    if (toDate) {
      params.append("to", new Date(toDate).toISOString())
    }

    if (status) {
      params.append("status", status)
    }

    if (workflowName) {
      params.append("name", workflowName)
    }

    const res = await fetch(
      `${API}/step-executions-grouped?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` }
      }
    )

    setExecutions(await res.json())
  }

  useEffect(() => {
    load()
  }, [])

  // paginación client-side
  const totalPages = Math.max(
    1,
    Math.ceil(executions.length / pageSize)
  )

  const paginatedExecutions = executions.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  return (
    <div className="steps-page">
      {/* ======================
           Header
      ====================== */}
      <div className="steps-header">
        <div className="steps-header-left">
          <h1>Executions</h1>
        </div>

        <div
          className="steps-header-right"
          style={{ gap: 8, alignItems: "center" }}
        >
          <input
            type="datetime-local"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            title="From"
          />

          <input
            type="datetime-local"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            title="To"
          />

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All status</option>
            <option value="DONE">DONE</option>
            <option value="ERROR">ERROR</option>
            <option value="RUNNING">RUNNING</option>
            <option value="PENDING">PENDING</option>
          </select>

          <input
            type="text"
            placeholder="Workflow name"
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
          />

          <button className="btn" onClick={load}>
            Apply
          </button>

          <button
            className="btn-expand"
            title="Expand all"
            onClick={expandAll}
          >
            <ExpandAllIcon />
          </button>

          <button
            className="btn-expand"
            title="Collapse all"
            onClick={collapseAll}
          >
            <CollapseAllIcon />
          </button>
        </div>
      </div>

      {/* ======================
           Pagination
      ====================== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8
        }}
      >
        <div>
          <button
            className="btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>

          <span style={{ margin: "0 8px" }}>
            Page {page} / {totalPages}
          </span>

          <button
            className="btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>

        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
            setPage(1)
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* ======================
           Table
      ====================== */}
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 60 }} />
            <ResizableTH style={{ width: 120 }}>Execution</ResizableTH>
            <ResizableTH style={{ width: 120 }}>Status</ResizableTH>
            <ResizableTH style={{ width: 260 }}>Workflow</ResizableTH>
            <ResizableTH>Description</ResizableTH>
            <ResizableTH style={{ width: 256 }}>Created</ResizableTH>
          </tr>
        </thead>

        <tbody>
          {paginatedExecutions.map(e => {
            const exec = e.execution
            const isOpen = expanded[exec.id]

            const createdAt =
              exec.created_at &&
              !exec.created_at.startsWith("0001-01-01")
                ? exec.created_at
                : e.steps?.[0]?.created_at

            return (
              <>
                <tr key={exec.id} className={isOpen ? "active" : ""}>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => toggle(exec.id)}
                    >
                      {isOpen ? "▾" : "▸"}
                    </button>
                  </td>

                  <td>{exec.id}</td>

                  <td>
                    <span className={statusClass(exec.status)}>
                      {exec.status}
                    </span>
                  </td>

                  <td>
                    <span className="badge-workflow">
                      {exec.workflow.name}
                    </span>
                  </td>

                  <td>{exec.workflow.description}</td>

                  <td>
                    {createdAt
                      ? new Date(createdAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>

                {isOpen && (
                  <tr>
                    <td colSpan={6} className="execution-expanded indent-bar-deep">
                      <table className="table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <ResizableTH style={{ width: 80 }}>
                              Step
                            </ResizableTH>
                            <ResizableTH style={{ width: 120 }}>
                              Status
                            </ResizableTH>
                            <ResizableTH style={{ width: 220 }}>
                              Name
                            </ResizableTH>
                            <ResizableTH style={{ width: 220 }}>
                              Operation
                            </ResizableTH>
                            <ResizableTH>Output</ResizableTH>
                            <ResizableTH style={{ width: 256 }}>
                              Created
                            </ResizableTH>
                          </tr>
                        </thead>

                        <tbody>
                          {e.steps.map(s => {
                            const openOutput = expandedOutput[s.id]

                            return (
                              <tr key={s.id}>
                                <td>{s.step_id}</td>
                                <td>
                                  <span className={statusClass(s.status)}>
                                    {s.status}
                                  </span>
                                </td>
                                <td>{s.step.Name}</td>
                                <td>{s.step.OperationType}</td>
                                <td>
                                  <pre
                                    onClick={() => toggleOutput(s.id)}
                                    style={{
                                      maxHeight: openOutput
                                        ? "none"
                                        : "1.4em",
                                      overflow: "hidden",
                                      whiteSpace: "pre-wrap",
                                      margin: 0,
                                      cursor: "pointer"
                                    }}
                                  >
                                    {s.output}
                                  </pre>
                                </td>
                                <td>
                                  {new Date(s.created_at).toLocaleString()}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
