import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ncrApi, capaApi } from '../api/d1Api'
import { Save, ArrowLeft, Printer, Plus, ClipboardList } from 'lucide-react'

const SOURCE_OPTIONS = [
  { value: 'RM_RECEIVING', label: 'รับวัตถุดิบ' },
  { value: 'IN_PROCESS', label: 'ระหว่างผลิต' },
  { value: 'CCP', label: 'CCP' },
  { value: 'FINAL_QC', label: 'ตรวจขั้นสุดท้าย' },
  { value: 'COMPLAINT', label: 'ข้อร้องเรียน' },
  { value: 'AUDIT', label: 'Audit' },
  { value: 'MAINTENANCE', label: 'ซ่อมบำรุง' },
  { value: 'OTHER', label: 'อื่นๆ' },
]

const SEVERITY_OPTIONS = ['Critical', 'Major', 'Minor']
const STATUS_OPTIONS = ['Open', 'In Investigation', 'Pending Verification', 'Closed']
const VERIFICATION_OPTIONS = ['-', 'Effective', 'Not Effective', 'Pending']

const CAPA_STATUS_CLS = {
  Open: 'bg-red-100 text-red-700',
  'Root Cause Analysis': 'bg-orange-100 text-orange-700',
  'Action Planning': 'bg-yellow-100 text-yellow-700',
  Implementation: 'bg-blue-100 text-blue-700',
  Verification: 'bg-purple-100 text-purple-700',
  'Closed Effective': 'bg-green-100 text-green-700',
  'Closed Not Effective': 'bg-red-200 text-red-800',
}

const EMPTY_FORM = {
  ncr_id: '',
  source_type: '',
  issue_date: '',
  product_lot_no: '',
  defect_qty: '',
  defect_unit: '',
  hold_location: '',
  severity: '',
  nc_description: '',
  immediate_action: '',
  reported_by: '',
  assignee: '',
  status: 'Open',
  root_cause: '',
  corrective_action: '',
  preventive_action: '',
  verification_result: '',
  verified_by: '',
  verification_note: '',
  closed_date: '',
  closed_by: '',
}

function SectionTitle({ children }) {
  return (
    <div className="bg-blue-900 text-white px-4 py-2 text-sm font-semibold rounded-t-lg mt-6 first:mt-0">
      {children}
    </div>
  )
}

function FieldRow({ label, children, half }) {
  return (
    <div className={`flex flex-col gap-1 ${half ? '' : ''}`}>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full'
const textareaCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full resize-none'
const selectCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full bg-white'

export default function NCRDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState(EMPTY_FORM)
  const [capas, setCapas] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    Promise.all([
      ncrApi.get(id),
      capaApi.listByNcr(id),
    ]).then(([ncr, capaList]) => {
      const d = ncr || {}
      setForm({
        ncr_id: d.ncr_id || '',
        source_type: d.source_type || '',
        issue_date: (d.issue_date || d.found_date || '').slice(0, 10),
        product_lot_no: d.product_lot_no || '',
        defect_qty: d.defect_qty ?? '',
        defect_unit: d.defect_unit || '',
        hold_location: d.hold_location || '',
        severity: d.severity || '',
        nc_description: d.nc_description || '',
        immediate_action: d.immediate_action || '',
        reported_by: d.reported_by || '',
        assignee: d.assignee || '',
        status: d.status || 'Open',
        root_cause: d.root_cause || '',
        corrective_action: d.corrective_action || '',
        preventive_action: d.preventive_action || '',
        verification_result: d.verification_result || '',
        verified_by: d.verified_by || '',
        verification_note: d.verification_note || '',
        closed_date: d.closed_date ? d.closed_date.slice(0, 10) : '',
        closed_by: d.closed_by || '',
      })
      setCapas(Array.isArray(capaList) ? capaList : [])
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.ncr_id.trim()) {
      setError('กรุณาระบุ NC No. ก่อนบันทึก')
      return
    }
    setSaving(true); setError(null); setSaveMsg(null)
    try {
      if (isNew) {
        const res = await ncrApi.create({ ...form, ncr_id: form.ncr_id.trim() })
        navigate(`/ncr/${res.ncr_id}`)
      } else {
        const res = await ncrApi.update(id, { ...form, ncr_id: form.ncr_id.trim() })
        const newId = res?.ncr_id || id
        setSaveMsg('บันทึกสำเร็จ')
        setTimeout(() => setSaveMsg(null), 3000)
        if (newId !== id) navigate(`/ncr/${newId}`, { replace: true })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/ncr')} className="p-2 hover:bg-white/20 rounded-lg transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm sm:text-base truncate">
              {isNew ? 'สร้าง NCR ใหม่' : `NCR: ${form.ncr_id || id}`}
            </div>
            <div className="text-blue-300 text-xs hidden sm:block">Non-Conformance Report · FM-QA-20</div>
          </div>
          {!isNew && (
            <button
              onClick={() => navigate(`/ncr/${id}/print`)}
              className="hidden sm:flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition"
            >
              <Printer className="w-4 h-4" />พิมพ์ A4
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 pb-24 sm:pb-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : (
          <>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <strong>เกิดข้อผิดพลาด:</strong> {error}
              </div>
            )}
            {saveMsg && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
                {saveMsg}
              </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <SectionTitle>ส่วน A — รายละเอียด NC</SectionTitle>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FieldRow label="NC No. *">
                    <input
                      type="text"
                      className={inputCls + ' font-mono font-semibold'}
                      value={form.ncr_id}
                      onChange={set('ncr_id')}
                      placeholder="เช่น NCR-2506-001"
                    />
                  </FieldRow>
                </div>
                <FieldRow label="แหล่งที่มา (Source Type)">
                  <select className={selectCls} value={form.source_type} onChange={set('source_type')}>
                    <option value="">-- เลือก --</option>
                    {SOURCE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
                    ))}
                  </select>
                </FieldRow>
                <FieldRow label="วันที่พบ (Found Date)">
                  <input type="date" className={inputCls} value={form.issue_date} onChange={set('issue_date')} />
                </FieldRow>
                <FieldRow label="Lot No. สินค้า / วัตถุดิบ">
                  <input type="text" className={inputCls} value={form.product_lot_no} onChange={set('product_lot_no')} placeholder="เช่น LOT-2025-001" />
                </FieldRow>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FieldRow label="จำนวนของเสีย (Qty)">
                      <input type="number" className={inputCls} value={form.defect_qty} onChange={set('defect_qty')} min={0} />
                    </FieldRow>
                  </div>
                  <div className="w-32">
                    <FieldRow label="หน่วย">
                      <input type="text" className={inputCls} value={form.defect_unit} onChange={set('defect_unit')} placeholder="kg, pcs..." />
                    </FieldRow>
                  </div>
                </div>
                <FieldRow label="สถานที่กักกัน (Hold Location)">
                  <input type="text" className={inputCls} value={form.hold_location} onChange={set('hold_location')} />
                </FieldRow>
                <FieldRow label="ระดับความรุนแรง (Severity)">
                  <select className={selectCls} value={form.severity} onChange={set('severity')}>
                    <option value="">-- เลือก --</option>
                    {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldRow>
                <div className="sm:col-span-2">
                  <FieldRow label="รายละเอียดปัญหา (NC Description)">
                    <textarea className={textareaCls} rows={3} value={form.nc_description} onChange={set('nc_description')} />
                  </FieldRow>
                </div>
                <div className="sm:col-span-2">
                  <FieldRow label="การแก้ไขเบื้องต้น (Immediate Action)">
                    <textarea className={textareaCls} rows={2} value={form.immediate_action} onChange={set('immediate_action')} />
                  </FieldRow>
                </div>
                <FieldRow label="ผู้รายงาน (Reported By)">
                  <input type="text" className={inputCls} value={form.reported_by} onChange={set('reported_by')} />
                </FieldRow>
                <FieldRow label="ผู้รับผิดชอบ (Assignee)">
                  <input type="text" className={inputCls} value={form.assignee} onChange={set('assignee')} />
                </FieldRow>
                <FieldRow label="สถานะ (Status)">
                  <select className={selectCls} value={form.status} onChange={set('status')}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldRow>
              </div>

              <SectionTitle>ส่วน B — Root Cause & Actions (ไม่บังคับ)</SectionTitle>
              <div className="p-4 grid grid-cols-1 gap-4">
                <FieldRow label="สาเหตุที่แท้จริง (Root Cause)">
                  <textarea className={textareaCls} rows={3} value={form.root_cause} onChange={set('root_cause')} />
                </FieldRow>
                <FieldRow label="มาตรการแก้ไข (Corrective Action)">
                  <textarea className={textareaCls} rows={3} value={form.corrective_action} onChange={set('corrective_action')} />
                </FieldRow>
                <FieldRow label="มาตรการป้องกัน (Preventive Action)">
                  <textarea className={textareaCls} rows={3} value={form.preventive_action} onChange={set('preventive_action')} />
                </FieldRow>
              </div>

              <SectionTitle>ส่วน C — Verification (ไม่บังคับ)</SectionTitle>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="ผลการตรวจสอบ (Verification Result)">
                  <select className={selectCls} value={form.verification_result} onChange={set('verification_result')}>
                    {VERIFICATION_OPTIONS.map(v => <option key={v} value={v === '-' ? '' : v}>{v}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="ผู้ตรวจสอบ (Verified By)">
                  <input type="text" className={inputCls} value={form.verified_by} onChange={set('verified_by')} />
                </FieldRow>
                <div className="sm:col-span-2">
                  <FieldRow label="หมายเหตุการตรวจสอบ (Verification Note)">
                    <textarea className={textareaCls} rows={2} value={form.verification_note} onChange={set('verification_note')} />
                  </FieldRow>
                </div>
                <FieldRow label="วันที่ปิด (Closed Date)">
                  <input type="date" className={inputCls} value={form.closed_date} onChange={set('closed_date')} />
                </FieldRow>
                <FieldRow label="ปิดโดย (Closed By)">
                  <input type="text" className={inputCls} value={form.closed_by} onChange={set('closed_by')} />
                </FieldRow>
              </div>

              <div className="px-4 pb-5 pt-2 hidden sm:flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>

            {!isNew && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-600" />
                    CAPA ที่เกี่ยวข้อง
                  </h2>
                </div>

                {capas.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400 text-sm">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    ยังไม่มี CAPA ที่เชื่อมโยง
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/capa/new?ncr_id=${id}`)}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                      >
                        <Plus className="w-4 h-4" />สร้าง CAPA ใหม่
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {capas.map(capa => (
                      <div key={capa.capa_id} className="bg-white rounded-xl shadow px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-blue-800 font-semibold text-sm">{capa.capa_id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CAPA_STATUS_CLS[capa.status] || 'bg-gray-100 text-gray-600'}`}>
                              {capa.status || '-'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 truncate">{capa.description || '-'}</div>
                          <div className="text-xs text-gray-400 mt-0.5">ผู้รับผิดชอบ: {capa.responsible_person || '-'}</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => navigate(`/capa/${capa.capa_id}`)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                          >
                            ดู/แก้ไข CAPA
                          </button>
                          <button
                            onClick={() => navigate(`/capa/${capa.capa_id}/print`)}
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                          >
                            <Printer className="w-3.5 h-3.5" />พิมพ์ CAPA
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => navigate(`/capa/new?ncr_id=${id}`)}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        <Plus className="w-4 h-4" />สร้าง CAPA ใหม่
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky save bar — mobile only */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        {!isNew && (
          <button
            onClick={() => navigate(`/ncr/${id}/print`)}
            className="flex items-center gap-1.5 border border-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white"
          >
            <Printer className="w-4 h-4" />A4
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <Save className="w-4 h-4" />
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  )
}
