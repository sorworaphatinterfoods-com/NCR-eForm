import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ncrApi } from '../api/base44'
import NCRFormA4 from '../components/NCRFormA4'
import { Printer, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'

export default function NCRPrintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    ncrApi.get(id)
      .then(data => setRecord(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Toolbar — hidden when printing */}
      <div className="no-print bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <button
          onClick={() => navigate('/ncr')}
          className="flex items-center gap-2 hover:bg-blue-800 px-3 py-2 rounded-lg text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับรายการ
        </button>
        <div className="text-sm font-medium">
          {record ? `NCR: ${record.ncr_number || record.id}` : 'ใบ NCR'}
        </div>
        <button
          onClick={handlePrint}
          disabled={loading || !!error}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Printer className="w-4 h-4" />
          พิมพ์ A4
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="no-print flex flex-col items-center justify-center py-24 text-gray-500">
          <RefreshCw className="w-10 h-10 animate-spin mb-3" />
          กำลังโหลดข้อมูล...
        </div>
      )}

      {error && (
        <div className="no-print max-w-lg mx-auto mt-10 bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>โหลดข้อมูลไม่ได้:</strong><br />{error}
          </div>
        </div>
      )}

      {record && <NCRFormA4 data={record} />}
    </div>
  )
}
