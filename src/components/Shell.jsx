import { useState, useEffect, useRef } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { parseProducts, prodNav, prodIcon, prodColor, daysUntil } from '../utils/fmt'
import logo from '../assets/logo.png'
import logoWhite from '../assets/logoWhite.png'

const navItems = t => [
  { id: 'dashboard', icon: 'home', label: t('dashboard') },
  { id: 'servers', icon: 'server', label: t('servers') },
  { id: 'dedicated', icon: 'cpu', label: t('dedicated') },
  { id: 'domains', icon: 'globe', label: t('domains') },
  { id: 'webspace', icon: 'layers', label: t('webspace') },
  { id: 'teamspeak', icon: 'headphones', label: t('teamspeak') },
  { id: 'ssl', icon: 'shield', label: t('ssl') },
  { id: 'ipv4', icon: 'network', label: t('ipv4') },
  { id: 'backup', icon: 'database', label: t('backup') },
]

function GlobalSearch() {
  const { api, cached, nav, t } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async q => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    const r = await cached('products', () => api('GET', 'product/all'))
    const all = parseProducts(r)
    const lower = q.toLowerCase()
    const filtered = all.filter(p => {
      const name = (p.customName || p.name || p.productInfo?.domain || p.domain || String(p.id)).toLowerCase()
      return name.includes(lower) || (p.type || '').toLowerCase().includes(lower)
    }).slice(0, 6)
    setResults(filtered)
    setOpen(true)
  }

  const handleChange = e => {
    const q = e.target.value
    setQuery(q)
    search(q)
  }

  const go = p => {
    nav(prodNav(p))
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="global-search" ref={ref}>
      <div className="global-search-input-wrap">
        <Ic ic={icons.search} sz={14} />
        <input
          type="text"
          className="global-search-input"
          placeholder={t('search_placeholder')}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length && setOpen(true)}
        />
      </div>
      {open && (
        <div className="global-search-dropdown">
          {results.length ? results.map(p => (
            <div key={p.id} className="search-result-item" onClick={() => go(p)}>
              <div className="search-result-icon" style={{ background: prodColor(p.type) }}>
                <Ic ic={icons[prodIcon(p.type)]} sz={14} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="search-result-name">{p.customName || p.name || p.productInfo?.domain || p.domain || p.id}</div>
                <div className="search-result-type">{p.type}</div>
              </div>
            </div>
          )) : (
            <div className="search-no-results">{t('no_servers')}</div>
          )}
        </div>
      )}
    </div>
  )
}

function NotifBell() {
  const { api, cached, t } = useApp()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const compute = async () => {
      const [prods, user] = await Promise.all([
        cached('products', () => api('GET', 'product/all')),
        cached('user', () => api('GET', 'account/user')),
      ])
      const all = parseProducts(prods)
      const now = Date.now()
      const soon = 30 * 24 * 60 * 60 * 1000
      const ns = []

      all.forEach(p => {
        const exp = p.expireAt || p.expire
        if (exp) {
          const diff = new Date(exp).getTime() - now
          if (diff > 0 && diff < soon) {
            const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
            ns.push({ type: 'expiry', label: p.customName || p.name || p.productInfo?.domain || p.domain || p.id, days })
          }
        }
      })

      const bal = user?.data?.balance?.amount ?? user?.data?.balance?.total
      if (bal !== null && bal !== undefined && Number(bal) < 5) {
        ns.push({ type: 'balance', label: `€${Number(bal).toFixed(2)}` })
      }

      setNotifs(ns)
    }
    compute()
  }, [])

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={() => setOpen(v => !v)}>
        <Ic ic={icons.bell} sz={16} />
        {notifs.length > 0 && <span className="notif-badge">{notifs.length}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">{t('notifications')}</div>
          {notifs.length ? notifs.map((n, i) => (
            <div key={i} className="notif-item">
              <Ic ic={icons.alertTriangle} sz={14} />
              <div>
                <div className="notif-item-label">{n.label}</div>
                {n.type === 'expiry' && <div className="notif-item-sub">{t('expiring_soon')} — {n.days} day{n.days !== 1 ? 's' : ''}</div>}
                {n.type === 'balance' && <div className="notif-item-sub">{t('low_balance')}</div>}
              </div>
            </div>
          )) : (
            <div className="notif-empty">{t('no_notifications')}</div>
          )}
        </div>
      )}
    </div>
  )
}

function Titlebar() {
  const isMac = window.sk?.platform === 'darwin'
  return (
    <div className="titlebar" style={!isMac ? {paddingRight:0} : {}}>
      {isMac ? (
        <div className="titlebar-controls">
          <button className="tb-btn tb-close" onClick={() => window.sk.winAction('close')} />
          <button className="tb-btn tb-min" onClick={() => window.sk.winAction('min')} />
          <button className="tb-btn tb-max" onClick={() => window.sk.winAction('max')} />
        </div>
      ) : <div style={{width:8}} />}
      <span className="titlebar-title">Skrime Desktop</span>
      <div className="titlebar-right">
        <GlobalSearch />
        <NotifBell />
        {!isMac && (
          <div className="win-controls">
            <button className="win-btn" onClick={() => window.sk.winAction('min')}>
              <svg viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
            </button>
            <button className="win-btn" onClick={() => window.sk.winAction('max')}>
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x=".5" y=".5" width="9" height="9"/></svg>
            </button>
            <button className="win-btn win-btn-close" onClick={() => window.sk.winAction('close')}>
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="0" y1="0" x2="10" y2="10"/><line x1="10" y1="0" x2="0" y2="10"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Sidebar() {
  const { view, nav, t, logout, showModal, closeModal, theme } = useApp()

  const items = navItems(t)
  const isActive = id => view === id || (id === 'servers' && view === 'server-detail') || (id === 'domains' && view === 'domain-detail')

  const handleLogout = () => {
    showModal(
      <ConfirmModal
        title={t('logout')}
        msg={t('logout_confirm')}
        onYes={() => { closeModal(); logout() }}
        onNo={closeModal}
      />
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={theme === 'dark' ? logoWhite : logo} alt="Skrime" />
      </div>
      <div className="sidebar-section-label">{t('products')}</div>
      {items.map(n => (
        <div key={n.id} className={`nav-item ${isActive(n.id) ? 'active' : ''}`} onClick={() => nav(n.id)}>
          <Ic ic={icons[n.icon]} sz={17} />
          <span>{n.label}</span>
        </div>
      ))}
      <div className="sidebar-spacer" />
      <div className="sidebar-bottom">
        <div className={`nav-item ${view === 'account' ? 'active' : ''}`} onClick={() => nav('account')}>
          <Ic ic={icons.creditcard} sz={17} /><span>{t('account')}</span>
        </div>
        <div className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => nav('settings')}>
          <Ic ic={icons.settings} sz={17} /><span>{t('settings')}</span>
        </div>
        <div className="nav-item" onClick={handleLogout}>
          <Ic ic={icons.logout} sz={17} /><span>{t('logout')}</span>
        </div>
      </div>
    </div>
  )
}

function StatusBanners() {
  const { t, offline, updateReady, updateAvailable } = useApp()
  if (!offline && !updateReady && !updateAvailable) return null
  return (
    <div className="status-banners">
      {offline && (
        <div className="status-banner banner-offline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"/></svg>
          {t('offline')}
        </div>
      )}
      {updateAvailable && !updateReady && (
        <div className="status-banner banner-update">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {t('update_downloading')}
        </div>
      )}
      {updateReady && (
        <div className="status-banner banner-update">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {t('update_ready')}
          <button onClick={() => window.sk.installUpdate()}>{t('restart_install')}</button>
        </div>
      )}
    </div>
  )
}

export function Shell({ children }) {
  return (
    <div className="app-shell">
      <Titlebar />
      <StatusBanners />
      <div className="app-body">
        <Sidebar />
        <main className="main-content" id="main-content-area">
          {children}
        </main>
      </div>
    </div>
  )
}

export function ConfirmModal({ title, msg, onYes, onNo, danger = false }) {
  const { t } = useApp()
  return (
    <div className="modal">
      <div className="modal-header"><h3>{title}</h3></div>
      <div className="modal-body"><p style={{fontSize:14,lineHeight:1.6,color:'var(--text-mid)'}}>{msg}</p></div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onNo}>{t('no')}</button>
        <button className={`btn ${danger ? 'btn-terra' : 'btn-primary'}`} onClick={onYes}>{t('yes')}</button>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const { t } = useApp()
  const m = {
    running: ['badge-green', 'dot-green', t('running')],
    active: ['badge-green', 'dot-green', t('active')],
    online: ['badge-green', 'dot-green', t('running')],
    stopped: ['badge-grey', 'dot-grey', t('stopped')],
    offline: ['badge-grey', 'dot-grey', t('stopped')],
    suspended: ['badge-red', 'dot-red', t('suspended')],
    cancelled: ['badge-red', 'dot-red', t('cancelled')],
    pending: ['badge-amber', 'dot-amber', t('pending')],
  }
  const k = (status || '').toLowerCase()
  const [bc, dc, label] = m[k] || ['badge-grey', 'dot-grey', status || t('unknown')]
  return <span className={`badge ${bc}`}><span className={`dot ${dc} pulse`} />{label}</span>
}

export function Loading() {
  return <div className="loading-full"><div className="spinner spinner-lg" /></div>
}

export function ExpiryBadge({ product }) {
  const { t } = useApp()
  const exp = product?.expireAt || product?.expire
  if (!exp) return null
  const days = daysUntil(exp)
  if (days === null || days < 0 || days > 7) return null
  const label = days === 0 ? t('expires_today') : t('expiring_in').replace('{n}', days)
  return <span className={`badge-expiry${days <= 1 ? ' urgent' : ''}`}>{label}</span>
}

export function ListControls({ sort, setSort, statusFilter, setStatusFilter }) {
  const { t } = useApp()
  return (
    <div className="list-controls">
      <select value={sort} onChange={e => setSort(e.target.value)}>
        <option value="">{t('sort_by')}</option>
        <option value="name_az">{t('sort_name_az')}</option>
        <option value="name_za">{t('sort_name_za')}</option>
        <option value="expiry">{t('sort_expiry')}</option>
      </select>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">{t('filter_all')}</option>
        <option value="active">{t('active')}</option>
        <option value="inactive">{t('stopped')}</option>
      </select>
    </div>
  )
}
