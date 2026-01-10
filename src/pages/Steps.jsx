import { useEffect, useMemo, useState } from "react"

const API = import.meta.env.VITE_API_BASE_URL
const TOKEN = import.meta.env.VITE_API_TOKEN

export default function Steps() {
  const [steps, setSteps] = useState([])
  const [agents, setAgents] = useState([])

  const [selected, setSelected] = useState(null)
  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [workflowFilter, setWorkflowFilter] = useState("all")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // ======================
  // Load data
  // ======================
  useEffect(() => {
    fetch(`${API}/steps`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
      .then(r => r.json())
      .then(setSteps)
  
    fetch(`${API}/agents`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
      .then(r => r.json())
      .then(data => {
        const normalized = data.map(a => ({
          id: a.ID,
          provider: a.Provider
        }))
        setAgents(normalized)
      })
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
    return steps.filter(
      s => s.workflow?.id === Number(workflowFilter)
    )
  }, [steps, workflowFilter])

  // ======================
  // Save
  // ======================
  const save = async () => {
    setError(null)

    if (!selectedAgentId) {
      setError("Please select an agent")
      return
    }

    const res = await fetch(`${API}/steps/${selected.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderIndex: selected.orderIndex,
        name: selected.name,
        prompt: selected.prompt,
        operationType: selected.operationType,
        workflowId: selected.workflow.id,
        agentId: Number(selectedAgentId)
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error || "Update failed")
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="steps-page">
      <h1>Steps</h1>

      {/* ====================== */}
      {/* Workflow filter */}
      {/* ====================== */}
      <div className="workflow-filter">
        <select
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

      {/* ====================== */}
      {/* Table */}
      {/* ====================== */}
      <table className="table">
        <thead>
          <tr>
            <th className="col-id">ID</th>
            <th className="col-name">Name</th>
            <th className="col-order">Order</th>
            <th>Agent</th>
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
                setSaved(false)
              }}
            >
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.orderIndex}</td>
              <td>{s.agent?.provider || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ====================== */}
      {/* Editor */}
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

          <label>Agent</label>
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select agent
            </option>
            {agents.map(a => (
              <option key={a.id} value={String(a.id)}>
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

          <button onClick={save}>Save</button>
        </section>
      )}
    </div>
  )
}
