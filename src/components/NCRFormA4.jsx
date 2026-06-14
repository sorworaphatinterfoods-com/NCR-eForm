import { COMPANY_NAME, COMPANY_NAME_EN, FORM_CODE, FORM_REVISION } from '../config'

const fmt = (d) => {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString('th-TH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch {
    return d
  }
}

const val = (v) => v || '-'

const NC_TYPE_LABELS = {
  raw_material: 'วัตถุดิบ',
  in_process: 'ระหว่างกระบวนการ',
  finished_product: 'สินค้าสำเร็จรูป',
  packaging: 'บรรจุภัณฑ์',
  customer_complaint: 'ข้อร้องเรียนลูกค้า',
  other: 'อื่นๆ',
}

const DETECTION_LABELS = {
  incoming: 'รับวัตถุดิบ (Incoming)',
  in_process: 'ระหว่างผลิต (In-Process)',
  final_inspection: 'ตรวจสอบขั้นสุดท้าย (Final Inspection)',
  customer: 'ลูกค้า (Customer)',
  other: 'อื่นๆ',
}

const STATUS_LABELS = {
  Open: 'เปิด (Open)',
  'In Progress': 'กำลังดำเนินการ (In Progress)',
  Closed: 'ปิด (Closed)',
  Verified: 'ตรวจสอบแล้ว (Verified)',
}

export default function NCRFormA4({ data }) {
  const d = data || {}

  const ncType = NC_TYPE_LABELS[d.nc_type] || d.nc_type || '-'
  const detectionPoint = DETECTION_LABELS[d.detection_point] || d.detection_point || '-'
  const status = STATUS_LABELS[d.status] || d.status || '-'

  return (
    <div className="a4-page" style={{ fontFamily: "'Sarabun', sans-serif" }}>

      {/* ===== HEADER ===== */}
      <table className="ncr-table" style={{ marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td rowSpan={3} style={{ width: '22%', textAlign: 'center', padding: '4px', borderRight: '1px solid #333' }}>
              {/* Company Logo / Name */}
              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a365d', lineHeight: '1.3' }}>
                SWI
              </div>
              <div style={{ fontSize: '7.5pt', color: '#444', lineHeight: '1.4' }}>
                {COMPANY_NAME}
              </div>
              <div style={{ fontSize: '7pt', color: '#666' }}>
                {COMPANY_NAME_EN}
              </div>
            </td>
            <td colSpan={2} style={{
              textAlign: 'center',
              fontSize: '13pt',
              fontWeight: '700',
              color: '#1a365d',
              padding: '4px',
              borderBottom: '1px solid #ccc',
            }}>
              ใบรายงานความไม่สอดคล้อง
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{
              textAlign: 'center',
              fontSize: '10pt',
              fontWeight: '600',
              color: '#2b6cb0',
              padding: '2px',
              borderBottom: '1px solid #ccc',
            }}>
              Non-Conformance Report (NCR)
            </td>
          </tr>
          <tr>
            <td style={{ width: '39%', padding: '3px 5px', fontSize: '8pt' }}>
              <strong>รหัสเอกสาร / Doc. No.:</strong> {FORM_CODE}<br />
              <strong>แก้ไขครั้งที่ / Rev.:</strong> {FORM_REVISION}
            </td>
            <td style={{ width: '39%', padding: '3px 5px', fontSize: '8pt' }}>
              <strong>NCR หมายเลข / NCR No.:</strong> <span style={{ color: '#c53030', fontWeight: '700' }}>{val(d.ncr_number)}</span><br />
              <strong>วันที่ออก / Issue Date:</strong> {fmt(d.created_date || d.date || d.created_at)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SECTION A: รายละเอียดความไม่สอดคล้อง ===== */}
      <table className="ncr-table" style={{ marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td colSpan={4} className="section-header">
              ส่วนที่ 1 : รายละเอียดความไม่สอดคล้อง &nbsp;/&nbsp; SECTION A : NONCONFORMANCE DETAILS
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ width: '18%' }}>แผนก / Department</td>
            <td className="value-cell" style={{ width: '32%' }}>{val(d.department)}</td>
            <td className="label-cell" style={{ width: '18%' }}>วันที่พบ / Date Found</td>
            <td className="value-cell" style={{ width: '32%' }}>{fmt(d.found_date || d.created_date || d.date)}</td>
          </tr>
          <tr>
            <td className="label-cell">สินค้า / Product</td>
            <td className="value-cell">{val(d.product_name || d.product)}</td>
            <td className="label-cell">Lot / Batch No.</td>
            <td className="value-cell" style={{ fontFamily: 'monospace', fontSize: '9pt' }}>{val(d.lot_number || d.batch_number)}</td>
          </tr>
          <tr>
            <td className="label-cell">จำนวน / Quantity</td>
            <td className="value-cell">
              {d.quantity ? `${d.quantity} ${d.unit || ''}`.trim() : '-'}
            </td>
            <td className="label-cell">สถานะ / Status</td>
            <td className="value-cell">
              <span style={{
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '8pt',
                fontWeight: '600',
                background: d.status === 'Closed' ? '#c6f6d5' : d.status === 'Open' ? '#fed7d7' : '#feebc8',
                color: d.status === 'Closed' ? '#276749' : d.status === 'Open' ? '#c53030' : '#c05621',
              }}>
                {status}
              </span>
            </td>
          </tr>
          <tr>
            <td className="label-cell">ประเภท NC / NC Type</td>
            <td className="value-cell">{ncType}</td>
            <td className="label-cell">จุดพบ / Detection Point</td>
            <td className="value-cell">{detectionPoint}</td>
          </tr>
          <tr>
            <td className="label-cell" style={{ verticalAlign: 'top' }}>
              รายละเอียดปัญหา<br />Problem Description
            </td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '45px' }}>
                {val(d.description || d.problem_description)}
              </div>
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ verticalAlign: 'top' }}>
              การดำเนินการเบื้องต้น<br />Immediate Action
            </td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '30px' }}>
                {val(d.immediate_action || d.containment_action)}
              </div>
            </td>
          </tr>
          <tr>
            <td className="label-cell">ผู้รายงาน / Reported By</td>
            <td className="value-cell">{val(d.reported_by || d.reporter_name)}</td>
            <td className="label-cell">วันที่รายงาน</td>
            <td className="value-cell">{fmt(d.reported_date || d.created_date)}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== SECTION B: การวิเคราะห์สาเหตุ ===== */}
      <table className="ncr-table avoid-break" style={{ marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td colSpan={4} className="section-header">
              ส่วนที่ 2 : การวิเคราะห์สาเหตุที่แท้จริง &nbsp;/&nbsp; SECTION B : ROOT CAUSE ANALYSIS
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ width: '20%', verticalAlign: 'top' }}>
              Why 1
            </td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '20px' }}>
                {val(d.why1 || d.why_1)}
              </div>
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ verticalAlign: 'top' }}>Why 2</td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '20px' }}>{val(d.why2 || d.why_2)}</div>
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ verticalAlign: 'top' }}>Why 3</td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '20px' }}>{val(d.why3 || d.why_3)}</div>
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ verticalAlign: 'top' }}>Why 4</td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '20px' }}>{val(d.why4 || d.why_4)}</div>
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ verticalAlign: 'top' }}>Why 5</td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '20px' }}>{val(d.why5 || d.why_5)}</div>
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ verticalAlign: 'top', background: '#dbeafe' }}>
              <strong>สาเหตุหลัก</strong><br />Root Cause
            </td>
            <td colSpan={3} className="value-cell" style={{ background: '#eff6ff' }}>
              <div className="text-block" style={{ minHeight: '30px', fontWeight: '500' }}>
                {val(d.root_cause)}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SECTION C: มาตรการแก้ไข ===== */}
      <table className="ncr-table avoid-break" style={{ marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td colSpan={4} className="section-header">
              ส่วนที่ 3 : มาตรการแก้ไข &nbsp;/&nbsp; SECTION C : CORRECTIVE ACTIONS
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ width: '20%', verticalAlign: 'top' }}>
              การแก้ไข<br />Actions
            </td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '50px' }}>
                {val(d.corrective_action || d.corrective_actions)}
              </div>
            </td>
          </tr>
          <tr>
            <td className="label-cell">ผู้รับผิดชอบ / Responsible</td>
            <td className="value-cell">{val(d.ca_responsible || d.corrective_responsible)}</td>
            <td className="label-cell">วันที่กำหนดเสร็จ / Due Date</td>
            <td className="value-cell">{fmt(d.ca_due_date || d.corrective_due_date)}</td>
          </tr>
          <tr>
            <td className="label-cell">วันที่ดำเนินการเสร็จ / Completed Date</td>
            <td className="value-cell">{fmt(d.ca_completed_date)}</td>
            <td className="label-cell">ผลการดำเนินการ / Result</td>
            <td className="value-cell">{val(d.ca_result)}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== SECTION D: มาตรการป้องกัน ===== */}
      <table className="ncr-table avoid-break" style={{ marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td colSpan={4} className="section-header">
              ส่วนที่ 4 : มาตรการป้องกัน &nbsp;/&nbsp; SECTION D : PREVENTIVE ACTIONS
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ width: '20%', verticalAlign: 'top' }}>
              การป้องกัน<br />Actions
            </td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '50px' }}>
                {val(d.preventive_action || d.preventive_actions)}
              </div>
            </td>
          </tr>
          <tr>
            <td className="label-cell">ผู้รับผิดชอบ / Responsible</td>
            <td className="value-cell">{val(d.pa_responsible || d.preventive_responsible)}</td>
            <td className="label-cell">วันที่กำหนดเสร็จ / Due Date</td>
            <td className="value-cell">{fmt(d.pa_due_date || d.preventive_due_date)}</td>
          </tr>
          <tr>
            <td className="label-cell">วันที่ดำเนินการเสร็จ / Completed Date</td>
            <td className="value-cell">{fmt(d.pa_completed_date)}</td>
            <td className="label-cell">ผลการดำเนินการ / Result</td>
            <td className="value-cell">{val(d.pa_result)}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== SECTION E: การตรวจสอบผล ===== */}
      <table className="ncr-table avoid-break" style={{ marginBottom: '3mm' }}>
        <tbody>
          <tr>
            <td colSpan={4} className="section-header">
              ส่วนที่ 5 : การตรวจสอบผลการดำเนินการ &nbsp;/&nbsp; SECTION E : VERIFICATION OF EFFECTIVENESS
            </td>
          </tr>
          <tr>
            <td className="label-cell" style={{ width: '20%', verticalAlign: 'top' }}>
              ผลการตรวจสอบ<br />Verification Results
            </td>
            <td colSpan={3} className="value-cell">
              <div className="text-block" style={{ minHeight: '35px' }}>
                {val(d.verification_result || d.effectiveness_result)}
              </div>
            </td>
          </tr>
          <tr>
            <td className="label-cell">ผู้ตรวจสอบ / Verified By</td>
            <td className="value-cell">{val(d.verified_by || d.verifier_name)}</td>
            <td className="label-cell">วันที่ตรวจสอบ / Verification Date</td>
            <td className="value-cell">{fmt(d.verification_date)}</td>
          </tr>
          <tr>
            <td className="label-cell">ผลการประเมิน / Evaluation</td>
            <td colSpan={3} className="value-cell">
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '8pt',
                fontWeight: '600',
                background: d.verification_passed === true || d.verification_passed === 'true' ? '#c6f6d5' : '#fed7d7',
                color: d.verification_passed === true || d.verification_passed === 'true' ? '#276749' : '#c53030',
              }}>
                {d.verification_passed === true || d.verification_passed === 'true'
                  ? 'ผ่าน (Effective)'
                  : d.verification_passed === false || d.verification_passed === 'false'
                    ? 'ไม่ผ่าน (Not Effective)'
                    : '-'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SIGNATURES ===== */}
      <table className="ncr-table">
        <tbody>
          <tr>
            <td style={{ width: '33.33%', padding: '4px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', fontWeight: '600', marginBottom: '18px' }}>ผู้รายงาน / Reported by</div>
              <div className="signature-line">
                {val(d.reported_by || d.reporter_name)}
              </div>
              <div style={{ fontSize: '7.5pt', marginTop: '3px', color: '#555' }}>
                วันที่ / Date: {fmt(d.reported_date || d.created_date)}
              </div>
            </td>
            <td style={{ width: '33.33%', padding: '4px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', fontWeight: '600', marginBottom: '18px' }}>ผู้ตรวจสอบ / Reviewed by</div>
              <div className="signature-line">
                {val(d.reviewed_by || d.reviewer_name)}
              </div>
              <div style={{ fontSize: '7.5pt', marginTop: '3px', color: '#555' }}>
                วันที่ / Date: {fmt(d.reviewed_date)}
              </div>
            </td>
            <td style={{ width: '33.33%', padding: '4px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', fontWeight: '600', marginBottom: '18px' }}>ผู้อนุมัติ / Approved by</div>
              <div className="signature-line">
                {val(d.approved_by || d.approver_name)}
              </div>
              <div style={{ fontSize: '7.5pt', marginTop: '3px', color: '#555' }}>
                วันที่ / Date: {fmt(d.approved_date)}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{
        marginTop: '3mm',
        fontSize: '7pt',
        color: '#888',
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid #ddd',
        paddingTop: '2mm',
      }}>
        <span>{FORM_CODE} Rev.{FORM_REVISION}</span>
        <span>{COMPANY_NAME_EN}</span>
        <span>NCR No.: {val(d.ncr_number)}</span>
      </div>
    </div>
  )
}
