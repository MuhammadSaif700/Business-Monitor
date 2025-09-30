// Simple history helpers using localStorage

const read = (k, defVal) => {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : defVal } catch { return defVal }
}
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

const AI_CHAT_KEY = 'ai_chat_history_v1'
const DASHBOARD_KEY = 'ai_dashboard_history_v1'

// AI Chat history: items = {id, ts, query, answer, aiError, chartType}
export function getAiChatHistory(){ return read(AI_CHAT_KEY, []) }
export function addAiChatHistory(item){
  const list = getAiChatHistory()
  const withId = { id: crypto?.randomUUID?.() || String(Date.now()), ts: Date.now(), ...item }
  const next = [withId, ...list].slice(0, 50)
  write(AI_CHAT_KEY, next)
  return next
}
export function clearAiChatHistory(){ write(AI_CHAT_KEY, []) }

// Dashboard config history: items = {id, ts, name, prompt, config}
export function getDashboardHistory(){ return read(DASHBOARD_KEY, []) }
export function addDashboardHistory(item){
  const list = getDashboardHistory()
  const withId = { id: crypto?.randomUUID?.() || String(Date.now()), ts: Date.now(), ...item }
  const next = [withId, ...list].slice(0, 50)
  write(DASHBOARD_KEY, next)
  return next
}
export function removeDashboardHistory(id){
  const list = getDashboardHistory().filter(x=> x.id !== id)
  write(DASHBOARD_KEY, list)
  return list
}
