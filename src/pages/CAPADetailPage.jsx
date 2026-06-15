import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { capaApi } from '../api/d1Api'
import { Save, ArrowLeft, Printer, ClipboardList } from 'lucide-react'

const SEVERITY_OPTS = ['Minor', 'Major', 'Critical']
const STATUS_OPTS = [
  'Open',
  'Root Cause Analysis',
  'Action Planning',
  'Implementation',
  'Verification',
  'Closed Effective',
  'Closed Not Effective',
]
const EFFECTIVENESS_OPTS = ['-', 'Effective', 'Not Effective', 'Pending']

function SectionTitle({ children }) {
  return (
    <div className="bg-blue-900 text-white px-4 py-2 text-sm font-semibold rounded-t-lg mt-6 first:mt-0">
      {children}
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full'
const textareaCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full resize-none'
const selectCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full bg-white'

const EMPTY_FORM = {
  source_ref: '',
  source: '',
  severity_label: '',
  description: '',
  detail: '',
  responsible_person: '',
  target_date: '',
  status: 'Open',
  why1: '',
  why2: '',
  why3: '',
  why4: '',
  why5: '',
  root_cause_summary: '',
  fishbone_man: '',
  fishbone_machine: '',
  fishbone_material: '',
  fishbone_method: '',
  fishbone_environment: '',
  fishbone_measurement: '',
  containment_action: '',
  corrective_action: '',
  preventive_action: '',
  effectiveness_criteria: '',
  effectiveness_result: '-',
  effectiveness_check_date: '',
  verified_by: '',
  verified_date: '',
  approved_by: '',
  approved_date: '',
}

export default function CAPADetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNew = !id || id === 'new'
  const prefillNcrId = searchParams.get('ncr_id') || ''

  const [form, setForm] = useState({ ...EMPTY_FORM, source_ref: prefillNcrId })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    capaApi.get(id)
      .then(data => {
        const d = data || {}
        setForm({
          source_ref: d.source_ref || '',
          source: d.source || '',
          severity_label: d.severity_label || '',
          description: d.description || '',
          detail: d.detail || '',
          responsible_person: d.responsible_person || '',
          target_date: d.target_date ? d.target_date.slice(0, 10) : '',
          status: d.status || 'Open',
          why1: d.why1 || '',
          why2: d.why2 || '',
          why3: d.why3 || '',
          why4: d.why4 || '',
          why5: d.why5 || '',
          root_cause_summary: d.root_cause_summary || '',
          fishbone_man: d.fishbone_man || '',
          fishbone_machine: d.fishbone_machine || '',
          fishbone_material: d.fishbone_material || '',
          fishbone_method: d.fishbone_method || '',
          fishbone_environment: d.fishbone_environment || '',
          fishbone_measurement: d.fishbone_measurement || '',
          containment_action: d.containment_action || '',
          corrective_action: d.corrective_action || '',
          preventive_action: d.preventive_action || '',
          effectiveness_criteria: d.effectiveness_criteria || '',
          effectiveness_result: d.effectiveness_result || '-',
          effectiveness_check_date: d.effectiveness_check_date ? d.effectiveness_check_date.slice(0, 10) : '',
          verified_by: d.verified_by || '',
          verified_date: d.verified_date ? d.verified_date.slice(0, 10) : '',
          approved_by: d.approved_by || '',
          approved_date: d.approved_date ? d.approved_date.slice(0, 10) : '',
        })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setError(null); setSaveMsg(null)
    try {
      if (isNew) {
        const res = await capaApi.create(form)
        const newId = res?.capa_id ?? res?.data?.capa_id
        navigate(`/capa/${newId}`)
      } else {
        await capaApi.update(id, form)
        setSaveMsg('บันทึกสำเร็จ')
        setTimeout(() => setSaveMsg(null), 3000)
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
          <button onClick={() => navigate('/capa')} className="p-2 hover:bg-white/20 rounded-lg transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm sm:text-base truncate">
              {isNew ? 'สร้าง CAPA ใหม่' : `CAPA: ${id}`}
            </div>
            <div className="text-blue-300 text-xs hidden sm:block">Corrective & Preventive Action · FM-QA-21</div>
          </div>
          {!isNew && (
            <button
              onClick={() => navigate(`/capa/${id}/print`)}
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
              <SectionTitle>ส่วน A — ข้อมูลทั่วไป</SectionTitle>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="NCR อ้างอิง (Source Ref)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.source_ref}
                    onChange={set('source_ref')}
                    readOnly={!!prefillNcrId}
                    placeholder="เช่น NCR-2025-001"
                  />
                </FieldRow>
                <FieldRow label="แหล่งที่มา (Source)">
                  <input type="text" className={inputCls} value={form.source} onChange={set('source')} placeholder="เช่น Internal Audit, QC" />
                </FieldRow>
                <FieldRow label="ความรุนแรง (Severity)">
                  <select className={selectCls} value={form.severity_label} onChange={set('severity_label')}>
                    <option value="">-- เลือก --</option>
                    {SEVERITY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="ผู้รับผิดชอบ (Responsible Person)">
                  <input type="text" className={inputCls} value={form.responsible_person} onChange={set('responsible_person')} placeholder="ชื่อผู้รับผิดชอบ" />
                </FieldRow>
                <div className="sm:col-span-2">
                  <FieldRow label="หัวข้อ CAPA (Description)">
                    <input type="text" className={inputCls} value={form.description} onChange={set('description')} placeholder="สรุปหัวข้อ CAPA" />
                  </FieldRow>
                </div>
                <div className="sm:col-span-2">
                  <FieldRow label="รายละเอียด NC (Detail)">
                    <textarea className={textareaCls} rows={3} value={form.detail} onChange={set('detail')} placeholder="อธิบายรายละเอียดปัญหา..." />
                  </FieldRow>
                </div>
                <FieldRow label="กำหนดแล้วเสร็จ (Target Date)">
                  <input type="date" className={inputCls} value={form.target_date} onChange={set('target_date')} />
                </FieldRow>
                <FieldRow label="สถานะ (Status)">
                  <select className={selectCls} value={form.status} onChange={set('status')}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldRow>
              </div>

              <SectionTitle>ส่วน B — 5-Why Analysis</SectionTitle>
              <div className="p-4 grid grid-cols-1 gap-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <FieldRow key={n} label={`Why ${n}`}>
                    <textarea className={textareaCls} rows={1} value={form[`why${n}`]} onChange={set(`why${n}`)} placeholder={`เหตุผลที่ ${n}...`} />
                  </FieldRow>
                ))}
                <FieldRow label="สรุปสาเหตุหลัก (Root Cause Summary)">
                  <textarea className={textareaCls} rows={2} value={form.root_cause_summary} onChange={set('root_cause_summary')} placeholder="สรุปสาเหตุที่แท้จริง..." />
                </FieldRow>
              </div>

              <SectionTitle>ส่วน C — Fishbone Analysis</SectionTitle>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="คน (Man)">
                  <input type="text" className={inputCls} value={form.fishbone_man} onChange={set('fishbone_man')} placeholder="ปัจจัยด้านคน" />
                </FieldRow>
                <FieldRow label="เครื่องจักร (Machine)">
                  <input type="text" className={inputCls} value={form.fishbone_machine} onChange={set('fishbone_machine')} placeholder="ปัจจัยด้านเครื่องจักร" />
                </FieldRow>
                <FieldRow label="วัตถุดิบ (Material)">
                  <input type="text" className={inputCls} value={form.fishbone_material} onChange={set('fishbone_material')} placeholder="ปัจจัยด้านวัตถุดิบ" />
                </FieldRow>
                <FieldRow label="วิธีการ (Method)">
                  <input type="text" className={inputCls} value={form.fishbone_method} onChange={set('fishbone_method')} placeholder="ปัจจัยด้านวิธีการ" />
                </FieldRow>
                <FieldRow label="สภาพแวดล้อม (Environment)">
                  <input type="text" className={inputCls} value={form.fishbone_environment} onChange={set('fishbone_environment')} placeholder="ปัจจัยด้านสภาพแวดล้อม" />
                </FieldRow>
                <FieldRow label="การวัด (Measurement)">
                  <input type="text" className={inputCls} value={form.fishbone_measurement} onChange={set('fishbone_measurement')} placeholder="ปัจจัยด้านการวัด" />
                </FieldRow>
              </div>

              <SectionTitle>ส่วน D — Actions</SectionTitle>
              <div className="p-4 grid grid-cols-1 gap-4">
                <FieldRow label="การควบคุมเบื้องต้น (Containment Action)">
                  <textarea className={textareaCls} rows={3} value={form.containment_action} onChange={set('containment_action')} />
                </FieldRow>
                <FieldRow label="มาตรการแก้ไข (Corrective Action)">
                  <textarea className={textareaCls} rows={3} value={form.corrective_action} onChange={set('corrective_action')} />
                </FieldRow>
                <FieldRow label="มาตรการป้องกัน (Preventive Action)">
                  <textarea className={textareaCls} rows={3} value={form.preventive_action} onChange={set('preventive_action')} />
                </FieldRow>
              </div>

              <SectionTitle>ส่วน E — Verification & Approval</SectionTitle>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FieldRow label="เกณฑ์ประสิทธิผล (Effectiveness Criteria)">
                    <textarea className={textareaCls} rows={2} value={form.effectiveness_criteria} onChange={set('effectiveness_criteria')} />
                  </FieldRow>
                </div>
                <FieldRow label="ผลการประเมินประสิทธิผล (Effectiveness Result)">
                  <select className={selectCls} value={form.effectiveness_result} onChange={set('effectiveness_result')}>
                    {EFFECTIVENESS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="วันที่ตรวจสอบประสิทธิผล">
                  <input type="date" className={inputCls} value={form.effectiveness_check_date} onChange={set('effectiveness_check_date')} />
                </FieldRow>
                <FieldRow label="ผู้ตรวจสอบ (Verified By)">
                  <input type="text" className={inputCls} value={form.verified_by} onChange={set('verified_by')} />
                </FieldRow>
                <FieldRow label="วันที่ตรวจสอบ (Verified Date)">
                  <input type="date" className={inputCls} value={form.verified_date} onChange={set('verified_date')} />
                </FieldRow>
                <FieldRow label="ผู้อนุมัติ (Approved By)">
                  <input type="text" className={inputCls} value={form.approved_by} onChange={set('approved_by')} />
                </FieldRow>
                <FieldRow label="วันที่อนุมัติ (Approved Date)">
                  <input type="date" className={inputCls} value={form.approved_date} onChange={set('approved_date')} />
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
          </>
        )}
      </div>

      {/* Sticky save bar — mobile only */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        {!isNew && (
          <button
            onClick={() => navigate(`/capa/${id}/print`)}
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
