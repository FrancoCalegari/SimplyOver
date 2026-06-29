import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './page.jsx' // previously app/page.js
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* You will need to map your other Next.js pages to Routes here */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
