import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NCRListPage from './pages/NCRListPage'
import NCRPrintPage from './pages/NCRPrintPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/ncr" replace />} />
        <Route path="/ncr" element={<NCRListPage />} />
        <Route path="/ncr/:id/print" element={<NCRPrintPage />} />
      </Routes>
    </BrowserRouter>
  )
}
