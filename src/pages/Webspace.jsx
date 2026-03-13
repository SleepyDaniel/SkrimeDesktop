import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading } from '../components/Shell'
import { fmtDate, parseProducts, filterByType, apiOk } from '../utils/fmt'

function WebspaceDetail({ ws, onBack }) {
  const { t, api, addToast, showModal, closeModal } = useApp()
  const [info, setInfo] = useState({})
  const [loginUrl, setLoginUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('GET', 'webspace/information', { productId: ws.id }),
      api('GET', 'webspace/login',       { productId: ws.id }),
    ]).then(([i, l]) => {
      setInfo(i?.data || {})
      setLoginUrl(l?.data?.loginUrl || null)
      setLoading(false)
    })
  }, [ws.id])

  if (loading) return <Loading />
  const d = info

  const showPasswordModal = () => {
    let pw = ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('change_password')}</h3></div>
        <div className="modal-body">
          <div className="form-group"><label>{t('new_password')} (min. 8)</label>
            <input type="password" minLength={8} onChange={e => pw = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            if (pw.length < 8) { addToast('Password must be at least 8 characters', 'error'); return }
            const r = await api('POST', 'webspace/passwd', { productId: ws.id, password: pw })
            if (apiOk(r)) addToast(t('password_updated'), 'success')
            else addToast(t('error_action'), 'error')
            closeModal()
          }}>{t('save')}</button>
        </div>
      </div>
    )
  }

  const copy = text => { navigator.clipboard.writeText(text); addToast(t('copied'), 'success', 1500) }

  return (
    <>
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={onBack}><Ic ic={icons.chevron} sz={16} /> {t('back')}</button>
          <h1 style={{marginTop:0}}>{d.domain || ws.customName || ws.id}</h1>
          <p><StatusBadge status={d.status || ws.state} /></p>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="detail-panel">
          <div className="card card-p">
            <div className="detail-section"><h3>Info</h3>
              <div className="info-grid">
                <div className="info-item"><label>Domain</label><span>{d.domain || '—'}</span></div>
                <div className="info-item"><label>{t('ip_address')}</label><span className="mono">{d.ipv4 || '—'}</span></div>
                {d.username && <div className="info-item"><label>Username</label>
                  <span className="mono">{d.username} <button className="copy-btn" onClick={() => copy(d.username)}><Ic ic={icons.copy} sz={13}/></button></span>
                </div>}
                {d.password && <div className="info-item"><label>Password</label>
                  <span className="mono">{d.password} <button className="copy-btn" onClick={() => copy(d.password)}><Ic ic={icons.copy} sz={13}/></button></span>
                </div>}
                {d.disk && <div className="info-item"><label>{t('disk_usage')}</label>
                  <span>{d.disk.used} / {d.disk.limit} GB ({d.disk.percentage}%)</span>
                </div>}
                <div className="info-item"><label>{t('expires')}</label><span>{fmtDate(ws.expireAt || ws.expire)}</span></div>
              </div>
            </div>
          </div>
          <div>
            {loginUrl && <button className="novnc-btn" style={{marginBottom:16}} onClick={() => window.sk.openUrl(loginUrl)}><Ic ic={icons.external} sz={18} /> {t('webspace_login')}</button>}
            <div className="card card-p">
              <button className="btn btn-ghost" style={{justifyContent:'flex-start',width:'100%'}} onClick={showPasswordModal}>
                <Ic ic={icons.lock} sz={16} /> {t('change_password')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Webspace() {
  const { t, api, cached, clearCache } = useApp()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setItems(filterByType(parseProducts(r), 'webspace'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <WebspaceDetail ws={selected} onBack={() => setSelected(null)} />

  return (
    <>
      <div className="page-header">
        <div><h1>{t('webspace')}</h1><p>{t('webspace_desc')}</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <div className="card">
            {items.length ? items.map(w => (
              <div key={w.id} className="product-row" onClick={() => setSelected(w)}>
                <div className="product-row-icon" style={{background:'var(--amber-l)',color:'#B8871F'}}><Ic ic={icons.layers} sz={18} /></div>
                <div className="product-row-main">
                  <div className="product-row-name">{w.customName || w.id}</div>
                  <div className="product-row-sub">{w.productInfo?.domain || w.type || ''}</div>
                </div>
                <div className="product-row-right"><StatusBadge status={w.state || w.status} /><Ic ic={icons.chevron} sz={16} /></div>
              </div>
            )) : <div className="empty-state"><Ic ic={icons.layers} sz={44} /><h3>{t('no_webspace')}</h3></div>}
          </div>
        )}
      </div>
    </>
  )
}
