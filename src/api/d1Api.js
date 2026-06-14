import { base44 } from './base44Client';

const NCR = base44.entities.NcrRecord;
const CAPA = base44.entities.CapaAction;

export const ncrApi = {
  list: () => NCR.list('-issue_date', 200),
  get: (id) => NCR.get(id),
  create: (body) => NCR.create(body),
  update: (id, body) => NCR.update(id, body),
};

export const capaApi = {
  list: () => CAPA.list('-created_at', 200),
  get: (id) => CAPA.get(id),
  create: (body) => CAPA.create(body),
  update: (id, body) => CAPA.update(id, body),
  listByNcr: (ncrId) => CAPA.filter({ source_ref: ncrId }),
};
