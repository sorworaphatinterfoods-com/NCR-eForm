import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NCRListPage from './pages/NCRListPage'
import NCRPrintPage from './pages/NCRPrintPage'
import NCRDetailPage from './pages/NCRDetailPage'
import CAPAListPage from './pages/CAPAListPage'
import CAPAPrintPage from './pages/CAPAPrintPage'
import CAPADetailPage from './pages/CAPADetailPage'
import SupplierReplyPage from './pages/SupplierReplyPage'
import SupplierCAPAReplyPage from './pages/SupplierCAPAReplyPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ncr" element={<NCRListPage />} />
        <Route path="/ncr/new" element={<NCRDetailPage />} />
        <Route path="/ncr/:id" element={<NCRDetailPage />} />
        <Route path="/ncr/:id/print" element={<NCRPrintPage />} />
        <Route path="/capa" element={<CAPAListPage />} />
        <Route path="/capa/new" element={<CAPADetailPage />} />
        <Route path="/capa/:id" element={<CAPADetailPage />} />
        <Route path="/capa/:id/print" element={<CAPAPrintPage />} />
        <Route path="/reply/:id" element={<SupplierReplyPage />} />
        <Route path="/capa-reply/:id" element={<SupplierCAPAReplyPage />} />
      </Routes>
    </BrowserRouter>
  )
}
