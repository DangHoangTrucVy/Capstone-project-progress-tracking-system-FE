import React from 'react'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './auth/Login'
import Register from './auth/Register'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        /> */}

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

       
      </Routes>
    </BrowserRouter>
  )
}

export default App
