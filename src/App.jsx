import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NCRListPage from './pages/NCRListPage'
import NCRPrintPage from './pages/NCRPrintPage'
import CAPAListPage from './pages/CAPAListPage'
import CAPAPrintPage from './pages/CAPAPrintPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/ncr" replace />} />
        <Route path="/ncr" element={<NCRListPage />} />
        <Route path="/ncr/:id/print" element={<NCRPrintPage />} />
        <Route path="/capa" element={<CAPAListPage />} />
        <Route path="/capa/:id/print" element={<CAPAPrintPage />} />
      </Routes>
    </BrowserRouter>
  )
}
