import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ncrApi } from '../api/d1Api'
import { FileText, Printer, RefreshCw, AlertCircle, ClipboardList } from 'lucide-react'

const STATUS = {
  Open: 'bg-red-100 text-red-700',
  'In Investigation': 'bg-orange-100 text-orange-700',
  'Pending Verification': 'bg-yellow-100 text-yellow-700',
  Closed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_TH = {
  Open: 'เปิด',
  'In Investigation': 'กำลังสอบสวน',
  'Pending Verification': 'รอตรวจสอบ',
  Closed: 'ปิด',
  Cancelled: 'ยกเลิก',
}

const SOURCE_TH = {
  RM_RECEIVING: 'รับวัตถุดิบ',
  IN_PROCESS: 'ระหว่างผลิต',
  CCP: 'CCP',
  FINAL_QC: 'ตรวจขั้นสุดท้าย',
  COMPLAINT: 'ข้อร้องเรียน',
  AUDIT: 'Audit',
  MAINTENANCE: 'ซ่อมบำรุง',
  OTHER: 'อื่นๆ',
}

export default function NCRListPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await ncrApi.list()
      setRecords(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const fmt = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'

  const filtered = records.filter(r =>
    !search ||
    (r.ncr_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.nc_description || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.lot_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reported_by || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg">NCR eForm — D1</div>
              <div className="text-blue-200 text-xs">Sorworaphat Foods · smart-qa-db</div>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Link to="/ncr" className="bg-blue-700 px-3 py-1.5 rounded text-sm font-medium">NCR Records</Link>
            <Link to="/capa" className="hover:bg-blue-800 px-3 py-1.5 rounded text-sm">CAPA Management</Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/ncr/new')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + สร้าง NCR ใหม่
          </button>
          <button onClick={load} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm transition">
            <RefreshCw className="w-4 h-4" />รีเฟรช
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="ค้นหา NCR ID / รายละเอียด / Lot No..."
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
                <th className="px-4 py-3">NCR ID</th>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">แหล่งที่มา</th>
                <th className="px-4 py-3">รายละเอียดปัญหา</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-center">พิมพ์ A4</th>
                <th className="px-4 py-3 text-center">แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />กำลังโหลด...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />ไม่พบข้อมูล NCR
                </td></tr>
              ) : filtered.map((r, i) => (
                <tr
                  key={r.ncr_id}
                  onClick={() => navigate(`/ncr/${r.ncr_id}`)}
                  className={`border-t hover:bg-blue-50 transition cursor-pointer ${i % 2 === 0 ? '' : 'bg-gray-50'}`}
                >
                  <td className="px-4 py-3 font-mono text-blue-800 font-medium">{r.ncr_id}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(r.issue_date)}</td>
                  <td className="px-4 py-3 text-xs">{SOURCE_TH[r.source_type] || r.source_type || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={r.nc_description}>{r.nc_description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      r.severity === 'Critical' ? 'bg-red-200 text-red-800' :
                      r.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{r.severity || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_TH[r.status] || r.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/ncr/${r.ncr_id}/print`)}
                      className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      <Printer className="w-3.5 h-3.5" />พิมพ์ A4
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/ncr/${r.ncr_id}`)}
                      className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      แก้ไข/ดู
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
