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
          const ALLOWED = ['ncr_id','issue_date','source_type','nc_description','severity','status',
            'immediate_action','lot_no','product_lot_no','hold_location','disposition','dispositioned_by',
            'root_cause','corrective_action','preventive_action','reported_by','assignee',
            'target_date','reply_date','verification_result','verification_note','verified_by',
            'verified_at','closed_date','closed_by','related_capa_id','defect_qty','defect_unit','photo_urls',
            'process_ref','material_code','material_name','supplier_id','supplier_name',
            'parameter_id','parameter_name','critical_limit','actual_result','visual_check'];
          const sets = [], vals = [];
          for (const k of ALLOWED) {
            if (k in body) { sets.push(`${k}=?`); vals.push(body[k] === '' ? null : body[k]); }
          }
          if (!sets.length) return err('No fields to update');
          if (body.status === 'Closed') {
            const cd = (body.closed_date || '').trim();
            // Only auto-fill closed_date when the user didn't pick one.
            if (!cd) sets.push("closed_date=date('now')");
            sets.push("days_open=CAST(julianday(?)-julianday(issue_date) AS INTEGER)");
            vals.push(cd || new Date().toISOString().slice(0, 10));
          }
          sets.push("updated_at=datetime('now')");
          vals.push(id);
          await DB.prepare(`UPDATE ncr_records SET ${sets.join(',')} WHERE ncr_id=?`).bind(...vals).run();
          return ok({ success: true, ncr_id: body.ncr_id || id });
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
            assignee,target_date,status,
            process_ref,material_code,material_name,supplier_id,supplier_name,
            parameter_id,parameter_name,critical_limit,actual_result,visual_check,
            created_by,created_at,updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
        `).bind(
          ncr_id,
          body.issue_date || new Date().toISOString().slice(0, 10),
          body.source_type || 'IN_PROCESS',
          body.lot_no || null, body.product_lot_no || null,
          body.nc_description || '',
          body.severity || 'Major',
          body.immediate_action || null,
          body.defect_qty || null, body.defect_unit || null,
          body.hold_location || null,
          body.disposition || null, body.dispositioned_by || null,
          body.reported_by || null,
          body.assignee || null, body.target_date || null,
          body.status || 'Open',
          body.process_ref || null,
          body.material_code || null, body.material_name || null,
          body.supplier_id || null, body.supplier_name || null,
          body.parameter_id || null, body.parameter_name || null,
          body.critical_limit || null, body.actual_result || null, body.visual_check || null,
          body.created_by || 'system',
        ).run();
        return ok({ ncr_id, success: true }, 201);
      }

      if (method === 'POST' && path === '/api/ncr/bulk') {
        const { records } = await req.json();
        if (!Array.isArray(records) || records.length === 0)
          return err('records array is required', 400);
        const created = [], errors = [];
        for (const r of records) {
          const ncr_id = (r.ncr_id || '').trim();
          if (!ncr_id) { errors.push({ ncr_id: '-', error: 'ไม่มี NC No.' }); continue; }
          try {
            const existing = await DB.prepare('SELECT ncr_id FROM ncr_records WHERE ncr_id=?').bind(ncr_id).first();
            if (existing) { errors.push({ ncr_id, error: 'มีอยู่แล้วในระบบ' }); continue; }
            const nz = (v) => { const s = (v ?? '').toString().trim(); return s === '' ? null : s; };
            await DB.prepare(`
              INSERT INTO ncr_records (
                ncr_id,issue_date,source_type,product_lot_no,nc_description,
                severity,hold_location,reported_by,assignee,status,
                process_ref,material_code,material_name,supplier_id,supplier_name,
                parameter_id,parameter_name,critical_limit,actual_result,visual_check,
                root_cause,corrective_action,preventive_action,target_date,reply_date,
                verification_result,closed_date,created_by,created_at,updated_at
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
            `).bind(
              ncr_id,
              r.issue_date || new Date().toISOString().slice(0, 10),
              r.source_type || 'IN_PROCESS',
              nz(r.product_lot_no),
              r.nc_description || '',
              r.severity || 'Major',
              nz(r.hold_location),
              nz(r.reported_by),
              nz(r.assignee),
              r.status || 'Open',
              nz(r.process_ref), nz(r.material_code), nz(r.material_name),
              nz(r.supplier_id), nz(r.supplier_name),
              nz(r.parameter_id), nz(r.parameter_name),
              nz(r.critical_limit), nz(r.actual_result), nz(r.visual_check),
              nz(r.root_cause), nz(r.corrective_action), nz(r.preventive_action),
              nz(r.target_date), nz(r.reply_date),
              nz(r.verification_result), nz(r.closed_date),
              'csv_import',
            ).run();
            created.push(ncr_id);
          } catch (e) {
            errors.push({ ncr_id, error: e.message });
          }
        }
        return ok({ created: created.length, errors }, 201);
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
            if (k in body) { sets.push(`${k}=?`); vals.push(body[k] === '' ? null : body[k]); }
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
