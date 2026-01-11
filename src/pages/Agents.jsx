import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    Provider: "",
    Secret: "",
  });

  // Load agents
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const res = await fetch(`${API_BASE_URL}/agents`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });
    setAgents(await res.json());
  };

  const startEdit = (agent) => {
    setEditingId(agent.ID);
    setEditForm({
      Provider: agent.Provider || "",
      Secret: agent.Secret || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    await fetch(`${API_BASE_URL}/agents/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ID: id,
        Provider: editForm.Provider,
        Secret: editForm.Secret,
      }),
    });

    await loadAgents();
    setEditingId(null);
  };

  const deleteAgent = async (id) => {
    const ok = window.confirm("Delete this agent?");
    if (!ok) return;

    await fetch(`${API_BASE_URL}/agents/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    // optimistic update
    setAgents((prev) => prev.filter((a) => a.ID !== id));
  };

  return (
    <div>
      <h1>Agents</h1>

      <table className="table">
        <thead>
          <tr>
            <th className="col-id">ID</th>
            <th className="col-name">Provider</th>
            <th className="col-name">Secret</th>
            <th className="col-order">Actions</th>
          </tr>
        </thead>

        <tbody>
          {agents.map((a) => {
            const editing = editingId === a.ID;

            return (
              <tr key={a.ID} className={editing ? "active" : ""}>
                <td className="col-id">{a.ID}</td>

                <td className="col-name">
                  {editing ? (
                    <input
                      value={editForm.Provider}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          Provider: e.target.value,
                        })
                      }
                    />
                  ) : (
                    a.Provider
                  )}
                </td>

                <td className="col-name">
                  {editing ? (
                    <input
                      value={editForm.Secret}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          Secret: e.target.value,
                        })
                      }
                    />
                  ) : a.Secret ? (
                    "••••••••••"
                  ) : (
                    ""
                  )}
                </td>

                <td className="col-order">
                  {!editing ? (
                    <>
                      <button
                        onClick={() => startEdit(a)}
                        style={iconButton}
                        title="Edit"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => deleteAgent(a.ID)}
                        style={{ ...iconButton, color: "#d33" }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => saveEdit(a.ID)}
                        style={iconButton}
                        title="Save"
                      >
                        ✔️
                      </button>

                      <button
                        onClick={cancelEdit}
                        style={iconButton}
                        title="Cancel"
                      >
                        ✖️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const iconButton = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
  marginRight: "4px",
};