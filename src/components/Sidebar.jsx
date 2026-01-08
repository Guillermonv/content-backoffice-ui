
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>Admin</h2>
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/steps">Steps</NavLink>
      <NavLink to="/agents">Agents</NavLink>
    </aside>
  )
}
