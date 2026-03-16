export const fmtDate = (d, lang = 'en') => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

export const fmtBytes = b => {
  if (!b || b === 0) return '0 B'
  const k = 1024, s = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i]
}

export const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'good_morning' : h < 17 ? 'good_afternoon' : 'good_evening'
}

export const copyToClipboard = async (text, onSuccess) => {
  try { await navigator.clipboard.writeText(text); onSuccess?.() } catch {}
}

export const TYPE_GROUPS = {
  server:    ['server', 'kvm', 'vps', 'cloud'],
  dedicated: ['dedicated', 'baremetal', 'bare_metal', 'dedi'],
  domain:    ['domain', 'domains'],
  webspace:  ['webspace', 'webhosting', 'hosting', 'web'],
  teamspeak: ['teamspeak', 'ts3', 'instance', 'voice', 'ts'],
  ssl:       ['ssl', 'certificate', 'cert'],
  ipv4:      ['ipv4', 'ip', 'subnet'],
  backup:    ['proxmox-backup', 'backup', 'pbs', 'proxmox_backup'],
}

export const filterByType = (products, group) => {
  const keys = TYPE_GROUPS[group] || [group]
  return products.filter(p => keys.includes((p.type || '').toLowerCase()))
}

export const parseProducts = r => {
  if (!r) return []
  const d = r.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.products)) return d.products
  return []
}

export const prodNav = p => {
  const m = { server: 'servers', kvm: 'servers', dedicated: 'dedicated', domain: 'domains', webspace: 'webspace', teamspeak: 'teamspeak', instance: 'teamspeak', ssl: 'ssl' }
  return m[(p.type || '').toLowerCase()] || 'dashboard'
}

export const prodIcon = type => {
  const m = { server: 'server', kvm: 'server', dedicated: 'cpu', domain: 'globe', webspace: 'layers', teamspeak: 'headphones', instance: 'headphones', ssl: 'shield', ipv4: 'network', proxmox_backup: 'database' }
  return m[(type || '').toLowerCase()] || 'server'
}

export const apiOk = r => r?.state === 'success' || r?.statusCode === 200

const ACTIVE_STATUSES = ['running', 'active', 'online', 'started']
const INACTIVE_STATUSES = ['stopped', 'offline', 'inactive', 'cancelled', 'suspended']

export const applyListControls = (items, sort, statusFilter) => {
  let out = [...items]
  const getStatus = p => (p.state || p.status || '').toLowerCase()
  const getName = p => (p.customName || p.name || p.domain || String(p.id)).toLowerCase()
  const getExp = p => new Date(p.expireAt || p.expire || 0).getTime()
  if (statusFilter === 'active') out = out.filter(p => ACTIVE_STATUSES.includes(getStatus(p)))
  else if (statusFilter === 'inactive') out = out.filter(p => INACTIVE_STATUSES.includes(getStatus(p)))
  if (sort === 'name_az') out.sort((a, b) => getName(a).localeCompare(getName(b)))
  else if (sort === 'name_za') out.sort((a, b) => getName(b).localeCompare(getName(a)))
  else if (sort === 'expiry') out.sort((a, b) => getExp(a) - getExp(b))
  return out
}

export const daysUntil = d => {
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

export const isExpiringSoon = (d, days = 7) => {
  const n = daysUntil(d)
  return n !== null && n >= 0 && n <= days
}

export const prodColor = type => {
  const m = { server: 'var(--blue-l)', kvm: 'var(--blue-l)', dedicated: 'var(--purple-l)', domain: 'var(--green-l)', webspace: 'var(--amber-l)', teamspeak: 'var(--terra-l)', instance: 'var(--terra-l)', ssl: 'var(--violet-l)' }
  return m[(type || '').toLowerCase()] || 'var(--surface2)'
}
