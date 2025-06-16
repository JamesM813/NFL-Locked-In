import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import LoginPage from './pages/Login/Login'
import './App.css'

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
      </Routes>
    </Router>
  )
}

export default App
