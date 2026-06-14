const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
};

const ok = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

const err = (msg, status = 400) => ok({ error: msg }, status);

function yyyymm() {
  const d = new Date();
  return d.toISOString().slice(2, 5).replace('-', '') +
    String(d.getMonth() + 1).padStart(2, '0');
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const DB = env.DB;

    if (!DB) return err('Database not connected', 503);

    try {
      // ─── Health ───────────────────────────────────────────────────────
      if (path === '/api/health') return ok({ ok: true, ts: new Date().toISOString() });

      // ─── NCR ──────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/api/ncr') {
        const status = url.searchParams.get('status');
        const severity = url.searchParams.get('severity');
        let q = 'SELECT * FROM ncr_records WHERE 1=1';
        const p = [];
        if (status) { q += ' AND status=?'; p.push(status); }
        if (severity) { q += ' AND severity=?'; p.push(severity); }
        q += ' ORDER BY issue_date DESC LIMIT 200';
        const { results } = await (p.length ? DB.prepare(q).bind(...p) : DB.prepare(q)).all();
        return ok(results);
      }

      const ncrMatch = path.match(/^\/api\/ncr\/([^/]+)$/);
      if (ncrMatch) {
        const id = ncrMatch[1];
        if (method === 'GET') {
          const row = await DB.prepare('SELECT * FROM ncr_records WHERE ncr_id=?').bind(id).first();
          return row ? ok(row) : err('NCR not found', 404);
        }
        if (method === 'PATCH') {
          const body = await req.json();
          const ALLOWED = ['nc_description','severity','status','immediate_action','lot_no',
            'product_lot_no','hold_location','disposition','dispositioned_by','root_cause',
            'corrective_action','preventive_action','assignee','target_date','reply_date',
            'verification_result','verification_note','verified_by','verified_at',
            'closed_date','related_capa_id','defect_qty','defect_unit','photo_urls'];
          const sets = [], vals = [];
          for (const k of ALLOWED) {
            if (k in body) { sets.push(`${k}=?`); vals.push(body[k]); }
          }
          if (!sets.length) return err('No fields to update');
          if (body.status === 'Closed') {
            sets.push("closed_date=date('now')");
            sets.push("days_open=CAST(julianday('now')-julianday(issue_date) AS INTEGER)");
          }
          sets.push("updated_at=datetime('now')");
          vals.push(id);
          await DB.prepare(`UPDATE ncr_records SET ${sets.join(',')} WHERE ncr_id=?`).bind(...vals).run();
          return ok({ success: true });
        }
      }

      if (method === 'POST' && path === '/api/ncr') {
        const body = await req.json();
        const ncr_id = (body.ncr_id || '').trim();
        if (!ncr_id) return err('กรุณาระบุ NC No. (ncr_id is required)', 400);
        const existing = await DB.prepare('SELECT ncr_id FROM ncr_records WHERE ncr_id=?').bind(ncr_id).first();
        if (existing) return err(`NC No. "${ncr_id}" มีอยู่แล้วในระบบ`, 409);
        await DB.prepare(`
          INSERT INTO ncr_records (
            ncr_id,issue_date,source_type,lot_no,product_lot_no,
            nc_description,severity,immediate_action,defect_qty,defect_unit,
            hold_location,disposition,dispositioned_by,reported_by,
            assignee,target_date,status,created_by,created_at,updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
        `).bind(
          ncr_id,
          body.issue_date || new Date().toISOString().slice(0, 10),
          body.source_type || 'IN_PROCESS',
          body.lot_no || null, body.product_lot_no || null,
          body.nc_description || '',
          body.severity || 'Medium',
          body.immediate_action || null,
          body.defect_qty || null, body.defect_unit || null,
          body.hold_location || null,
          body.disposition || null, body.dispositioned_by || null,
          body.reported_by || null,
          body.assignee || null, body.target_date || null,
          body.status || 'Open',
          body.created_by || 'system',
        ).run();
        return ok({ ncr_id, success: true }, 201);
      }

      // ─── CAPA ─────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/api/capa') {
        const ncr_id = url.searchParams.get('ncr_id');
        const status = url.searchParams.get('status');
        let q = 'SELECT * FROM capa_actions WHERE 1=1';
        const p = [];
        if (ncr_id) { q += " AND source_ref=? AND source='NCR'"; p.push(ncr_id); }
        if (status) { q += ' AND status=?'; p.push(status); }
        q += ' ORDER BY created_at DESC LIMIT 200';
        const { results } = await (p.length ? DB.prepare(q).bind(...p) : DB.prepare(q)).all();
        return ok(results);
      }

      const capaMatch = path.match(/^\/api\/capa\/([^/]+)$/);
      if (capaMatch) {
        const id = capaMatch[1];
        if (method === 'GET') {
          const row = await DB.prepare('SELECT * FROM capa_actions WHERE capa_id=?').bind(id).first();
          return row ? ok(row) : err('CAPA not found', 404);
        }
        if (method === 'PATCH') {
          const body = await req.json();
          const ALLOWED = ['description','detail','priority','severity_label','status',
            'responsible_person','target_date','why1','why2','why3','why4','why5',
            'root_cause_summary','root_cause_analysis',
            'fishbone_man','fishbone_machine','fishbone_material',
            'fishbone_method','fishbone_environment','fishbone_measurement',
            'containment_action','corrective_action','preventive_action',
            'effectiveness_criteria','effectiveness_result','effectiveness_check_date',
            'verified_by','verified_date','approved_by','approved_date',
            'closed_by','closed_date','actual_completion'];
          const sets = [], vals = [];
          for (const k of ALLOWED) {
            if (k in body) { sets.push(`${k}=?`); vals.push(body[k]); }
          }
          if (!sets.length) return err('No fields to update');
          sets.push("updated_at=datetime('now')");
          vals.push(id);
          await DB.prepare(`UPDATE capa_actions SET ${sets.join(',')} WHERE capa_id=?`).bind(...vals).run();
          return ok({ success: true });
        }
      }

      if (method === 'POST' && path === '/api/capa') {
        const body = await req.json();
        const yymm = yyyymm();
        const { n } = await DB.prepare(
          `SELECT COUNT(*) as n FROM capa_actions WHERE capa_id LIKE ?`
        ).bind(`${yymm}%`).first() || {};
        const capa_id = body.capa_id || `${yymm}-${String((n || 0) + 1).padStart(3, '0')}`;
        await DB.prepare(`
          INSERT INTO capa_actions (
            capa_id,source,source_ref,description,detail,
            priority,severity_label,responsible_person,target_date,status,
            why1,why2,why3,why4,why5,root_cause_summary,
            fishbone_man,fishbone_machine,fishbone_material,
            fishbone_method,fishbone_environment,fishbone_measurement,
            containment_action,corrective_action,preventive_action,
            created_by,created_at,updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
        `).bind(
          capa_id,
          body.source || 'NCR', body.source_ref || null,
          body.description || '', body.detail || null,
          body.priority || 'MEDIUM', body.severity_label || 'Major',
          body.responsible_person || null,
          body.target_date || null,
          body.status || 'Open',
          body.why1||null, body.why2||null, body.why3||null,
          body.why4||null, body.why5||null,
          body.root_cause_summary || null,
          body.fishbone_man||null, body.fishbone_machine||null,
          body.fishbone_material||null, body.fishbone_method||null,
          body.fishbone_environment||null, body.fishbone_measurement||null,
          body.containment_action || null,
          body.corrective_action || null,
          body.preventive_action || null,
          body.created_by || 'system',
        ).run();
        return ok({ capa_id, success: true }, 201);
      }

      return err(`Not found: ${method} ${path}`, 404);
    } catch (e) {
      console.error(`[ERR] ${method} ${path}:`, e.message);
      return err(e.message, 500);
    }
  },
};
