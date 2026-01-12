import { useEffect, useMemo, useState } from "react"

const API = import.meta.env.VITE_API_BASE_URL
const TOKEN = import.meta.env.VITE_API_TOKEN

export default function Steps() {
  const [steps, setSteps] = useState([])
  const [agents, setAgents] = useState([])

  const [workflowFilter, setWorkflowFilter] = useState("all")

  const [selected, setSelected] = useState(null)
  const [selectedAgentId, setSelectedAgentId] = useState("")

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    orderIndex: 1,
    operationType: "AI_CLIENT_CALL",
    workflowId: "",
    agentId: ""
  })

  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // ======================
  // Load data
  // ======================
  const loadAll = async () => {
    const [stepsRes, agentsRes] = await Promise.all([
      fetch(`${API}/steps`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      }),
      fetch(`${API}/agents`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      })
    ])

    const stepsData = await stepsRes.json()
    const agentsData = await agentsRes.json()

    setSteps(stepsData)
    setAgents(
      agentsData.map(a => ({
        id: a.ID,
        provider: a.Provider
      }))
    )
  }

  useEffect(() => {
    loadAll()
  }, [])

  // ======================
  // Workflows dropdown
  // ======================
  const workflows = useMemo(() => {
    const map = new Map()
    steps.forEach(s => {
      if (s.workflow) {
        map.set(s.workflow.id, s.workflow.name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [steps])

  // ======================
  // Filtered steps
  // ======================
  const filteredSteps = useMemo(() => {
    if (workflowFilter === "all") return steps
    return steps.filter(s => s.workflow?.id === Number(workflowFilter))
  }, [steps, workflowFilter])

  // ======================
  // Create
  // ======================
  const createStep = async () => {
    setError(null)

    if (!createForm.name || !createForm.workflowId) {
      setError("Name and workflow are required")
      return
    }

    const res = await fetch(`${API}/steps`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Name: createForm.name,
        OrderIndex: createForm.orderIndex,
        OperationType: createForm.operationType,
        WorkflowID: Number(createForm.workflowId),
        AgentID: createForm.agentId
          ? Number(createForm.agentId)
          : null
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error || "Create failed")
      return
    }

    setShowCreate(false)
    setCreateForm({
      name: "",
      orderIndex: 1,
      operationType: "AI_CLIENT_CALL",
      workflowId: "",
      agentId: ""
    })
    loadAll()
  }

  // ======================
  // Update
  // ======================
  const save = async () => {
    setError(null)

    const res = await fetch(`${API}/steps/${selected.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: selected.name,
        orderIndex: selected.orderIndex,
        operationType: selected.operationType,
        workflowId: selected.workflow.id,
        agentId: selectedAgentId ? Number(selectedAgentId) : null,
        prompt: selected.prompt
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error || "Update failed")
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
    loadAll()
  }

  // ======================
  // Delete
  // ======================
  const deleteStep = async id => {
    if (!window.confirm("Delete this step?")) return

    await fetch(`${API}/steps/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` }
    })

    setSelected(null)
    loadAll()
  }

  return (
    <div className="steps-page">
      <h1>Steps</h1>

      {/* ====================== */}
      {/* Header */}
      {/* ====================== */}
      <div className="steps-header">
        <div className="steps-header-left">
          <button
            className="btn-primary"
            onClick={() => setShowCreate(v => !v)}
          >
            {showCreate ? "Cancel Step" : "+ New Step"}
          </button>
        </div>

        <div className="steps-header-center">
        <select
          className="select-primary"
          value={workflowFilter}
          onChange={e => setWorkflowFilter(e.target.value)}
        >
          <option value="all">All workflows</option>
          {workflows.map(w => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        </div>

        <div className="steps-header-right" />
      </div>

      {/* ====================== */}
      {/* Create */}
      {/* ====================== */}
      {showCreate && (
        <section className="editor">
          <h3>Create Step</h3>

          {error && <div className="error">{error}</div>}

          <label>Name</label>
          <input
            value={createForm.name}
            onChange={e =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
          />

          <label>Order</label>
          <input
            type="number"
            value={createForm.orderIndex}
            onChange={e =>
              setCreateForm({
                ...createForm,
                orderIndex: Number(e.target.value)
              })
            }
          />

          <label>Operation Type</label>
          <input
            value={createForm.operationType}
            onChange={e =>
              setCreateForm({
                ...createForm,
                operationType: e.target.value
              })
            }
          />

          <label>Workflow</label>
          <select
            value={createForm.workflowId}
            onChange={e =>
              setCreateForm({
                ...createForm,
                workflowId: e.target.value
              })
            }
          >
            <option value="">Select workflow</option>
            {workflows.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <label>Agent (optional)</label>
          <select
            value={createForm.agentId}
            onChange={e =>
              setCreateForm({
                ...createForm,
                agentId: e.target.value
              })
            }
          >
            <option value="">None</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.provider}
              </option>
            ))}
          </select>

          <button className="btn-primary" onClick={createStep}>
            Create
          </button>
        </section>
      )}

      {/* ====================== */}
      {/* Table */}
      {/* ====================== */}
      <table className="table">
      <thead>
          <tr>
            <th className="col-id">ID</th>
            <th>Name</th>
            <th>Workflow</th> {/* 👈 nueva */}
            <th className="col-order">Order</th>
            <th>Agent</th>
            <th className="col-order">Actions</th>
          </tr>
        </thead>

            <tbody>
      {filteredSteps.map(s => (
        <tr
          key={s.id}
          className={selected?.id === s.id ? "active" : ""}
          onClick={() => {
            setSelected({ ...s })
            setSelectedAgentId(
              s.agent?.id ? String(s.agent.id) : ""
            )
            setError(null)
          }}
        >
          <td>{s.id}</td>
          <td>{s.name}</td>

          {/* 👇 NUEVA COLUMNA */}
          <td>
            <span className="badge-workflow">
              {s.workflow?.name || "-"}
            </span>
          </td>

          <td>{s.orderIndex}</td>
          <td>{s.agent?.provider || "-"}</td>
          <td>
            <button
              className="btn-icon danger"
              onClick={e => {
                e.stopPropagation()
                deleteStep(s.id)
              }}
              title="Delete"
            >
              🗑️
            </button>
          </td>
        </tr>
      ))}
    </tbody>

      </table>

      {/* ====================== */}
      {/* Edit */}
      {/* ====================== */}
      {selected && (
        <section className="editor">
          <h3>
            Edit Step #{selected.id}
            {saved && <span className="saved-check">✔</span>}
          </h3>

          {error && <div className="error">{error}</div>}

          <label>Name</label>
          <input
            value={selected.name}
            onChange={e =>
              setSelected({ ...selected, name: e.target.value })
            }
          />

          <label>Order</label>
          <input
            type="number"
            value={selected.orderIndex}
            onChange={e =>
              setSelected({
                ...selected,
                orderIndex: Number(e.target.value)
              })
            }
          />

          <label>Operation Type</label>
          <input
            value={selected.operationType}
            onChange={e =>
              setSelected({
                ...selected,
                operationType: e.target.value
              })
            }
          />

          <label>Agent (optional)</label>
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
          >
            <option value="">None</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.provider}
              </option>
            ))}
          </select>

          <label>Prompt</label>
          <textarea
            rows="8"
            value={selected.prompt}
            onChange={e =>
              setSelected({ ...selected, prompt: e.target.value })
            }
          />

          <button className="btn-primary" onClick={save}>
            Save
          </button>
        </section>
      )}
    </div>
  )
}
