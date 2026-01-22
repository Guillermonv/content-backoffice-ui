
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Steps from './pages/Steps'
import Agents from './pages/Agents'
import Workflows from './pages/Workflows'
import Executions from './pages/Executions'
import ContentReview from './pages/ContentReview'



export default function App() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/steps" element={<Steps />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/executions" element={<Executions />} />
          <Route path="/contentReview" element={<ContentReview />} />
        </Routes>
      </main>
    </div>
  )
}
