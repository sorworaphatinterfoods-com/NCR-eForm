import { API_URL } from '../config'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

export const ncrApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params)
    return request(`/api/ncr?${q}`)
  },
  get: (id) => request(`/api/ncr/${id}`),
  create: (body) => request('/api/ncr', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/ncr/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
}

export const capaApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params)
    return request(`/api/capa?${q}`)
  },
  get: (id) => request(`/api/capa/${id}`),
  create: (body) => request('/api/capa', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/capa/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listByNcr: (ncrId) => request(`/api/capa?ncr_id=${encodeURIComponent(ncrId)}`),
}
