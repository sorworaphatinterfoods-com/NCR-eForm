import { BASE44_API_KEY, BASE44_BASE_URL } from '../config'

const headers = {
  'api-key': BASE44_API_KEY,
  'Content-Type': 'application/json',
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE44_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

export const ncrApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ sort: '-created_date', ...params })
    return request(`/entities/NCR?${q}`)
  },

  get: (id) => request(`/entities/NCR/${id}`),

  create: (data) =>
    request('/entities/NCR', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    request(`/entities/NCR/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}
