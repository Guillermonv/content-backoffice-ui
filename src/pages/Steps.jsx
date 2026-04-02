import { useEffect, useState, Fragment } from "react"
import { useAuth } from "../context/AuthContext"

const API = import.meta.env.VITE_API_BASE_URL

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

export default function Steps() {
  const { apiFetch } = useAuth()
  const [steps, setSteps] = useState([])
  const [agents, setAgents] = useState([])
  const [workflows, setWorkflows] = useState([])

  const [expanded, setExpanded] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    orderIndex: 1,
    operationType: "AI_CLIENT_CALL",
    workflowId: "",
    agentId: "",
    prompt: ""
  })

  /* ======================
     LOADERS
  ====================== */

  const loadSteps = async () => {
    const res = await apiFetch(`${API}/steps`)
    if (!res) return
    setSteps(await res.json())
  }

  const loadAgents = async () => {
    const res = await apiFetch(`${API}/agents`)
    if (!res) return
    const data = await res.json()

    setAgents(
      data.map(a => ({
        id: a.ID,
        provider: a.Provider
      }))
    )
  }

  const loadWorkflows = async () => {
    const res = await apiFetch(`${API}/workflows`)
    if (!res) return
    const data = await res.json()

    setWorkflows(
      data.map(w => ({
        id: w.ID,
        name: w.Name
      }))
    )
  }

  const loadAll = async () => {
    await Promise.all([
      loadSteps(),
      loadAgents(),
      loadWorkflows()
    ])
  }

  useEffect(() => {
    loadAll()
  }, [])

  /* ======================
     HELPERS
  ====================== */

  const hasPrompt = s =>
    typeof s.prompt === "string" && s.prompt.trim().length > 0

  /* ======================
     ACTIONS
  ====================== */

  const toggleExpand = id => {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }

  const startEdit = step => {
    setEditingId(step.id)
    setEditForm({
      id: step.id,
      name: step.name,
      orderIndex: step.orderIndex,
      operationType: step.operationType,
      workflowId: step.workflow?.id || "",
      agentId: step.agent?.id || "",
      prompt: step.prompt || ""
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    await apiFetch(`${API}/steps/${editForm.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID: editForm.id,
        Name: editForm.name,
        OrderIndex: editForm.orderIndex,
        OperationType: editForm.operationType,
        WorkflowID: Number(editForm.workflowId),
        AgentID: editForm.agentId ? Number(editForm.agentId) : null,
        Prompt: editForm.prompt
      })
    })

    cancelEdit()
    loadSteps()
  }

  const createStep = async () => {
    await apiFetch(`${API}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: createForm.name,
        OrderIndex: createForm.orderIndex,
        OperationType: createForm.operationType,
        WorkflowID: Number(createForm.workflowId),
        AgentID: createForm.agentId
          ? Number(createForm.agentId)
          : null,
        Prompt: createForm.prompt
      })
    })

    setShowCreate(false)
    setCreateForm({
      name: "",
      orderIndex: 1,
      operationType: "AI_CLIENT_CALL",
      workflowId: "",
      agentId: "",
      prompt: ""
    })

    loadSteps()
  }

  const remove = async id => {
    if (!window.confirm("Delete this step?")) return

    await apiFetch(`${API}/steps/${id}`, { method: "DELETE" })

    loadSteps()
  }

  /* ======================
     RENDER
  ====================== */

  return (
    <div className="steps-page">
      <h1>Steps</h1>

      <button
        className="btn-primary"
        onClick={() => setShowCreate(v => !v)}
      >
        {showCreate ? "Cancel" : "+ Add Step"}
      </button>

      <br /><br />

      {showCreate && (
        <div className="editor">
          <label>Name</label>
          <input
            value={createForm.name}
            onChange={e =>
              setCreateForm(f => ({ ...f, name: e.target.value }))
            }
          />

          <label>Order</label>
          <input
            type="number"
            value={createForm.orderIndex}
            onChange={e =>
              setCreateForm(f => ({
                ...f,
                orderIndex: Number(e.target.value)
              }))
            }
          />

          <label>Operation Type</label>
          <input
            value={createForm.operationType}
            onChange={e =>
              setCreateForm(f => ({
                ...f,
                operationType: e.target.value
              }))
            }
          />

          <label>Workflow</label>
          <select
            value={createForm.workflowId}
            onChange={e =>
              setCreateForm(f => ({
                ...f,
                workflowId: e.target.value
              }))
            }
          >
            <option value="">— Select workflow —</option>
            {workflows.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <label>Agent</label>
          <select
            value={createForm.agentId}
            onChange={e =>
              setCreateForm(f => ({
                ...f,
                agentId: e.target.value
              }))
            }
          >
            <option value="">— None —</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.provider}
              </option>
            ))}
          </select>

          <label>Prompt</label>
          <textarea
            rows="4"
            value={createForm.prompt}
            onChange={e =>
              setCreateForm(f => ({ ...f, prompt: e.target.value }))
            }
          />

          <button className="btn-primary" onClick={createStep}>
            Create
          </button>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: "40px" }} />
            <ResizableTH style={{ width: "80px" }}>ID</ResizableTH>
            <ResizableTH style={{ width: "180px" }}>Name</ResizableTH>
            <ResizableTH style={{ width: "180px" }}>Operation</ResizableTH>
            <ResizableTH style={{ width: "80px" }}>Order</ResizableTH>
            <ResizableTH style={{ width: "200px" }}>Workflow</ResizableTH>
            <ResizableTH style={{ width: "200px" }}>Agent</ResizableTH>
            <ResizableTH style={{ width: "120px" }}>Actions</ResizableTH>
          </tr>
        </thead>

        <tbody>
          {steps.map(s => {
            const open = expanded[s.id]
            const editing = editingId === s.id
            const expandable = hasPrompt(s)

            return (
              <Fragment key={s.id}>
                <tr className={editing ? "editing" : ""}>
                  <td>
                    {expandable && (
                      <button
                        className="btn-icon"
                        onClick={() => toggleExpand(s.id)}
                      >
                        {open ? "▾" : "▸"}
                      </button>
                    )}
                  </td>

                  <td>{s.id}</td>

                  <td>
                    {editing ? (
                      <input
                        value={editForm.name}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            name: e.target.value
                          }))
                        }
                      />
                    ) : (
                      s.name
                    )}
                  </td>

                  <td>
                    {editing ? (
                      <input
                        value={editForm.operationType}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            operationType: e.target.value
                          }))
                        }
                      />
                    ) : (
                      s.operationType
                    )}
                  </td>

                  <td>
                    {editing ? (
                      <input
                        type="number"
                        value={editForm.orderIndex}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            orderIndex: Number(e.target.value)
                          }))
                        }
                      />
                    ) : (
                      s.orderIndex
                    )}
                  </td>

                  {/* WORKFLOW COLUMN */}
                  <td>
                    {editing ? (
                      <select
                        value={editForm.workflowId}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            workflowId: e.target.value
                          }))
                        }
                      >
                        <option value="">— Select workflow —</option>
                        {workflows.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      s.workflow?.Name || "-"
                    )}
                  </td>

                  <td>
                    {editing ? (
                      <select
                        value={editForm.agentId}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            agentId: e.target.value
                          }))
                        }
                      >
                        <option value="">— None —</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.provider}
                          </option>
                        ))}
                      </select>
                    ) : (
                      s.agent?.provider || "-"
                    )}
                  </td>

                  <td>
                    {editing ? (
                      <>
                        <button className="btn-icon" onClick={saveEdit}>✔</button>
                        <button className="btn-icon" onClick={cancelEdit}>✕</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-icon" onClick={() => startEdit(s)}>✏️</button>
                        <button className="btn-icon danger" onClick={() => remove(s.id)}>🗑</button>
                      </>
                    )}
                  </td>
                </tr>

                {expandable && open && (
                  <tr className="inner-row">
                    <td colSpan={8}>
                      <div className="editor">
                        <label>Prompt</label>
                        {editing ? (
                          <textarea
                            rows="6"
                            value={editForm.prompt}
                            onChange={e =>
                              setEditForm(f => ({
                                ...f,
                                prompt: e.target.value
                              }))
                            }
                          />
                        ) : (
                          <textarea rows="6" value={s.prompt} disabled />
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}