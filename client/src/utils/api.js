const BASE = '';

const req = async (method, path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
};

export const api = {
  register: (data) => req('POST', '/auth/register', data),
  login: (data) => req('POST', '/auth/login', data),
  me: (token) => req('GET', '/auth/me', null, token),
  enrollFace: (descriptor, token) => req('POST', '/auth/face/enroll', { descriptor: Array.from(descriptor) }, token),
  verifyFace: (descriptor, token) => req('POST', '/auth/face/verify', { descriptor: Array.from(descriptor) }, token),
  getElections: () => req('GET', '/elections'),
  getElection: (id) => req('GET', `/elections/${id}`),
  getResults: (id) => req('GET', `/elections/${id}/results`),
  castVote: (data, token) => req('POST', '/votes/cast', data, token),
  getMyVotes: (token) => req('GET', '/votes/my', null, token),
  checkVoted: (electionId, token) => req('GET', `/votes/check/${electionId}`, null, token),
  createElection: (data, token) => req('POST', '/admin/elections', data, token),
  updateElectionStatus: (id, status, token) => req('PATCH', `/admin/elections/${id}/status`, { status }, token),
  deleteElection: (id, token) => req('DELETE', `/admin/elections/${id}`, null, token),
  getVoters: (token) => req('GET', '/admin/voters', null, token),
  getStats: (token) => req('GET', '/admin/stats', null, token),
  getBlocks: () => req('GET', '/blockchain/blocks'),
  verifyChain: () => req('GET', '/blockchain/verify'),
};

export const createWS = (onMessage) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.hostname}:5000`;
  let ws, retryCount = 0;
  const connect = () => {
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => { retryCount = 0; };
      ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
      ws.onclose = () => { if (retryCount < 5) { retryCount++; setTimeout(connect, 2000 * retryCount); } };
    } catch(e) {}
  };
  connect();
  return { close: () => ws?.close() };
};
