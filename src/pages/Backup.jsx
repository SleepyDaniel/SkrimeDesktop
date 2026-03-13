import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading } from '../components/Shell'
import { fmtDate, parseProducts, filterByType, apiOk } from '../utils/fmt'

function BackupDetail({ backup, onBack }) {
  const { t, api, addToast, showModal, closeModal } = useApp()
  const [info, setInfo] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('GET', 'proxmox-backup/information', { productId: backup.id }).then(r => { setInfo(r?.data || {}); setLoading(false) })
  }, [backup.id])

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
            const r = await api('POST', 'proxmox-backup/passwd', { productId: backup.id, password: pw })
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
          <h1 style={{marginTop:0}}>{backup.customName || backup.id}</h1>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="grid-2" style={{alignItems:'start'}}>
          <div className="card card-p">
            <div className="info-grid">
              <div className="info-item"><label>Server IP</label><span className="mono">{d.ipv4 || '—'}</span></div>
              <div className="info-item"><label>Username</label>
                <span className="mono">{d.username || '—'} {d.username && <button className="copy-btn" onClick={() => copy(d.username)}><Ic ic={icons.copy} sz={13}/></button>}</span>
              </div>
              <div className="info-item"><label>Password</label>
                <span className="mono">{d.password || '—'} {d.password && <button className="copy-btn" onClick={() => copy(d.password)}><Ic ic={icons.copy} sz={13}/></button>}</span>
              </div>
              <div className="info-item"><label>Datastore</label>
                <span>{d.datastore || '—'} {d.datastore && <button className="copy-btn" onClick={() => copy(d.datastore)}><Ic ic={icons.copy} sz={13}/></button>}</span>
              </div>
              {d.fingerprint && <div className="info-item"><label>Fingerprint</label>
                <span className="mono" style={{fontSize:11,wordBreak:'break-all'}}>{d.fingerprint}
                  <button className="copy-btn" onClick={() => copy(d.fingerprint)} style={{marginLeft:4}}><Ic ic={icons.copy} sz={13}/></button>
                </span>
              </div>}
              <div className="info-item"><label>{t('expires')}</label><span>{fmtDate(backup.expireAt || backup.expire)}</span></div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {d.url && (
              <button className="novnc-btn" onClick={() => window.sk.openUrl(d.url)}>
                <Ic ic={icons.external} sz={18} /> Open PBS Web UI
              </button>
            )}
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

export default function Backup() {
  const { t, api, cached, clearCache } = useApp()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setItems(filterByType(parseProducts(r), 'backup'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <BackupDetail backup={selected} onBack={() => setSelected(null)} />

  return (
    <>
      <div className="page-header">
        <div><h1>{t('backup')}</h1><p>Proxmox Backup Server</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <div className="card">
            {items.length ? items.map(b => (
              <div key={b.id} className="product-row" onClick={() => setSelected(b)}>
                <div className="product-row-icon" style={{background:'var(--surface2)'}}><Ic ic={icons.database} sz={18} /></div>
                <div className="product-row-main">
                  <div className="product-row-name">{b.customName || b.id}</div>
                  <div className="product-row-sub">{t('expires')}: {fmtDate(b.expireAt || b.expire)}</div>
                </div>
                <div className="product-row-right"><StatusBadge status={b.state || b.status} /><Ic ic={icons.chevron} sz={16} /></div>
              </div>
            )) : <div className="empty-state"><Ic ic={icons.database} sz={44} /><h3>No Proxmox Backup services</h3></div>}
          </div>
        )}
      </div>
    </>
  )
}
