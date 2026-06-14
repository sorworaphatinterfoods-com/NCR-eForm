import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ncrApi } from '../api/base44'
import { FileText, Printer, RefreshCw, AlertCircle } from 'lucide-react'

const STATUS_LABEL = {
  Open: { label: 'เปิด', cls: 'bg-red-100 text-red-700' },
  'In Progress': { label: 'กำลังดำเนินการ', cls: 'bg-orange-100 text-orange-700' },
  Closed: { label: 'ปิด', cls: 'bg-green-100 text-green-700' },
  Verified: { label: 'ตรวจสอบแล้ว', cls: 'bg-blue-100 text-blue-700' },
}

export default function NCRListPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ncrApi.list()
      setRecords(Array.isArray(data) ? data : data?.data || data?.results || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = records.filter(r =>
    !search ||
    (r.ncr_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6" />
          <div>
            <div className="font-bold text-lg">NCR eForm</div>
            <div className="text-blue-200 text-xs">Non-Conformance Report — Sorworaphat Foods</div>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="ค้นหา NCR หมายเลข / แผนก / สินค้า..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="text-sm text-gray-500 flex items-center px-3">
            {filtered.length} รายการ
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>ไม่สามารถโหลดข้อมูลได้:</strong> {error}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-900 text-white text-left">
                <th className="px-4 py-3">NCR หมายเลข</th>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">แผนก</th>
                <th className="px-4 py-3">สินค้า / ผลิตภัณฑ์</th>
                <th className="px-4 py-3">Lot No.</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-center">พิมพ์ A4</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    ไม่พบข้อมูล NCR
                  </td>
                </tr>
              ) : filtered.map((r, i) => {
                const s = STATUS_LABEL[r.status] || { label: r.status || '-', cls: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={r.id || i} className={`border-t hover:bg-blue-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-blue-800">{r.ncr_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(r.created_date || r.date || r.created_at)}</td>
                    <td className="px-4 py-3">{r.department || '-'}</td>
                    <td className="px-4 py-3">{r.product_name || r.product || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.lot_number || r.batch_number || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/ncr/${r.id}/print`)}
                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        พิมพ์ A4
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
