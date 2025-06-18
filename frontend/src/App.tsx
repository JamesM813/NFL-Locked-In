import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import RootRedirect from './components/RootRedirect'
import './App.css'

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect/>}/>
        <Route path="/login" element={<LoginPage/>} />
          <Route element={<ProtectedRoute/>}>
            <Route path="/dashboard" element={<DashboardPage/>}/>
          </Route>
      </Routes>
    </Router>
  )
}

export default App
