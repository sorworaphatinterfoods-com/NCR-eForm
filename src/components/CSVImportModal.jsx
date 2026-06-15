import { useState, useRef, useCallback } from 'react'
import { ncrApi } from '../api/d1Api'
import { Upload, X, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react'

const TEMPLATE_HEADERS = ['ncr_id', 'issue_date', 'source_type', 'nc_description', 'severity', 'product_lot_no', 'hold_location', 'reported_by', 'assignee', 'status']
const TEMPLATE_EXAMPLE = ['NCR-2506-001', '2026-06-15', 'IN_PROCESS', 'พบสิ่งแปลกปลอมในผลิตภัณฑ์', 'High', 'LOT-2506-001', 'ห้องเย็น A', 'สมชาย ใจดี', 'สมหญิง รักงาน', 'Open']

const SOURCE_LABELS = {
  RM_RECEIVING: 'RM_RECEIVING',
  IN_PROCESS: 'IN_PROCESS',
  CCP: 'CCP',
  FINAL_QC: 'FINAL_QC',
  COMPLAINT: 'COMPLAINT',
  AUDIT: 'AUDIT',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER',
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) throw new Error('ไฟล์ CSV ต้องมีอย่างน้อย 2 แถว (header + ข้อมูล)')

  const parseRow = (line) => {
    const result = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        result.push(cur.trim()); cur = ''
      } else cur += ch
    }
    result.push(cur.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const vals = parseRow(lines[i])
    const row = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] || '' })
    rows.push(row)
  }
  return { headers, rows }
}

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(','), TEMPLATE_EXAMPLE.join(',')].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'ncr_import_template.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

const SEV_CLS = { Critical: 'text-red-600', High: 'text-orange-600', Medium: 'text-amber-600', Low: 'text-green-600' }

export default function CSVImportModal({ onClose, onSuccess }) {
  const fileInputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState(null)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setParseError('กรุณาเลือกไฟล์ .CSV เท่านั้น')
      return
    }
    setParseError(null); setRows(null); setResult(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { rows } = parseCSV(e.target.result)
        if (rows.length === 0) throw new Error('ไม่พบข้อมูลในไฟล์')
        setRows(rows)
      } catch (err) {
        setParseError(err.message)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleImport = async () => {
    if (!rows || rows.length === 0) return
    setImporting(true)
    try {
      const res = await ncrApi.bulkCreate(rows)
      setResult(res)
      if (res.created > 0) onSuccess?.()
    } catch (e) {
      setParseError(e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] rounded-t-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">นำเข้าข้อมูล NCR จาก CSV</h2>
            <p className="text-xs text-gray-500 mt-0.5">รองรับไฟล์ .csv (UTF-8)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* Template download */}
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium">ดาวน์โหลด Template</p>
              <p className="text-xs text-blue-600 mt-0.5">ncr_id, issue_date, source_type, nc_description, severity ...</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />Template
            </button>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              {fileName ? (
                <p className="text-sm font-medium text-blue-700 flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4" />{fileName}
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">วาง .CSV ที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                  <p className="text-xs text-gray-400 mt-1">รองรับเฉพาะไฟล์ .csv</p>
                </>
              )}
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="flex flex-col gap-3">
              <div className={`rounded-xl px-4 py-4 flex gap-3 ${result.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${result.created > 0 ? 'text-green-600' : 'text-amber-600'}`} />
                <div>
                  <p className={`font-semibold text-sm ${result.created > 0 ? 'text-green-800' : 'text-amber-800'}`}>
                    นำเข้าสำเร็จ {result.created} รายการ
                  </p>
                  {result.errors?.length > 0 && (
                    <p className="text-xs text-amber-700 mt-0.5">ข้ามไป {result.errors.length} รายการ (มีข้อผิดพลาด)</p>
                  )}
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-gray-50 px-4 py-2 font-medium text-gray-600">รายการที่ข้ามไป</div>
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-4 py-2 border-t border-gray-100 flex justify-between gap-2">
                      <span className="font-mono text-gray-700">{e.ncr_id}</span>
                      <span className="text-red-600">{e.error}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition"
              >
                ปิด
              </button>
            </div>
          )}

          {/* Preview table */}
          {rows && !result && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">ตัวอย่างข้อมูล ({rows.length} แถว)</p>
                <button onClick={() => { setRows(null); setFileName('') }} className="text-xs text-gray-400 hover:text-gray-600">ล้าง</button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-52">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="px-3 py-2 text-left font-medium whitespace-nowrap">NC No.</th>
                        <th className="px-3 py-2 text-left font-medium whitespace-nowrap">วันที่</th>
                        <th className="px-3 py-2 text-left font-medium whitespace-nowrap">รายละเอียด</th>
                        <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Severity</th>
                        <th className="px-3 py-2 text-left font-medium whitespace-nowrap">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((r, i) => (
                        <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? '' : 'bg-slate-50'}`}>
                          <td className="px-3 py-2 font-mono font-semibold text-blue-800">{r.ncr_id || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{r.issue_date || '—'}</td>
                          <td className="px-3 py-2 max-w-[180px]">
                            <span className="line-clamp-1 text-gray-700">{r.nc_description || '—'}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`font-semibold ${SEV_CLS[r.severity] || 'text-gray-500'}`}>{r.severity || '—'}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-500">{r.status || 'Open'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && (
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                    และอีก {rows.length - 10} แถว...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {rows && !result && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'กำลังนำเข้า...' : `นำเข้า ${rows.length} รายการ`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
