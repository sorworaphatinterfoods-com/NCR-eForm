import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { capaApi } from '../api/d1Api'
import { ClipboardList, Printer, RefreshCw, AlertCircle } from 'lucide-react'

const STATUS_CLS = {
  Open: 'bg-red-100 text-red-700',
  'Root Cause Analysis': 'bg-orange-100 text-orange-700',
  'Action Planning': 'bg-yellow-100 text-yellow-700',
  Implementation: 'bg-blue-100 text-blue-700',
  Verification: 'bg-purple-100 text-purple-700',
  'Closed Effective': 'bg-green-100 text-green-700',
  'Closed Not Effective': 'bg-red-200 text-red-800',
  Overdue: 'bg-red-300 text-red-900',
}

export default function CAPAListPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await capaApi.list()
      setRecords(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const fmt = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'

  const filtered = records.filter(r =>
    !search ||
    (r.capa_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.source_ref || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.responsible_person || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg">CAPA Management — D1</div>
              <div className="text-blue-200 text-xs">Corrective & Preventive Action · smart-qa-db</div>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Link to="/ncr" className="hover:bg-blue-800 px-3 py-1.5 rounded text-sm">NCR Records</Link>
            <Link to="/capa" className="bg-blue-700 px-3 py-1.5 rounded text-sm font-medium">CAPA Management</Link>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm transition">
          <RefreshCw className="w-4 h-4" />รีเฟรช
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="ค้นหา CAPA ID / หัวข้อ / NCR ID / ผู้รับผิดชอบ..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm text-gray-500 flex items-center px-3">{filtered.length} รายการ</span>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div><strong>ไม่สามารถโหลดข้อมูลได้:</strong> {error}</div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-900 text-white text-left">
                <th className="px-4 py-3">CAPA ID</th>
                <th className="px-4 py-3">หัวข้อ CAPA</th>
                <th className="px-4 py-3">NCR อ้างอิง</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">ผู้รับผิดชอบ</th>
                <th className="px-4 py-3">กำหนดวัน</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-center">พิมพ์ A4</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />กำลังโหลด...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />ไม่พบข้อมูล CAPA
                </td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.capa_id} className={`border-t hover:bg-blue-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3 font-mono font-medium text-blue-800">{r.capa_id}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={r.description}>{r.description || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.source_ref || '-'}</td>
                  <td className="px-4 py-3 text-xs">{r.source || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      r.severity_label === 'Major' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{r.severity_label || r.priority || '-'}</span>
                  </td>
                  <td className="px-4 py-3">{r.responsible_person || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(r.target_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_CLS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/capa/${r.capa_id}/print`)}
                      className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      <Printer className="w-3.5 h-3.5" />พิมพ์ A4
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
