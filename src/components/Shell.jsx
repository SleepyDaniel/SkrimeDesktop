import { useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import logo from '../assets/logo.png'

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

function Titlebar() {
  const isMac = window.sk?.platform === 'darwin'
  return (
    <div className="titlebar">
      {isMac ? (
        <div className="titlebar-controls">
          <button className="tb-btn tb-close" onClick={() => window.sk.winAction('close')} />
          <button className="tb-btn tb-min" onClick={() => window.sk.winAction('min')} />
          <button className="tb-btn tb-max" onClick={() => window.sk.winAction('max')} />
        </div>
      ) : <div style={{width:8}} />}
      <span className="titlebar-title">Skrime Desktop</span>
    </div>
  )
}

function Sidebar() {
  const { view, nav, t, logout, showModal, closeModal } = useApp()

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
        <img src={logo} alt="Skrime" />
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

export function Shell({ children }) {
  return (
    <div className="app-shell">
      <Titlebar />
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
