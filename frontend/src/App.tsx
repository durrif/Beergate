import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import AppLayout from './components/Layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Purchases from './pages/Purchases'
import Recipes from './pages/Recipes'
import Recommendations from './pages/Recommendations'
import Login from './pages/Login'
import './App.css'

function App() {
  // TODO: Implement proper auth check
  const isAuthenticated = false

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="recommendations" element={<Recommendations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
