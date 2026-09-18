import React from 'react'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './auth/Login'
import Register from './auth/Register'
import Home from './components/Home'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

       
      </Routes>
    </BrowserRouter>
  )
}

export default App
