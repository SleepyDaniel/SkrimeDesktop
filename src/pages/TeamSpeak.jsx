import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading, ConfirmModal, ExpiryBadge, ListControls } from '../components/Shell'
import { parseProducts, filterByType, apiOk, applyListControls } from '../utils/fmt'

function TSDetail({ ts, onBack }) {
  const { t, api, addToast, showModal, closeModal } = useApp()
  const [info, setInfo] = useState({})
  const [wl, setWl] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [i, w] = await Promise.all([
      api('GET', 'instance/information', { productId: ts.id }),
      api('GET', 'instance/whitelist',   { productId: ts.id }),
    ])
    setInfo(i?.data || {})
    setWl(i?.data ? (w?.data?.whitelist || []) : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [ts.id])

  if (loading) return <Loading />
  const d = info
  const srvState = d.state || ts.state || ''
  const isRunning = ['running', 'online', 'started', 'active'].includes(srvState.toLowerCase())

  const action = act => {
    showModal(<ConfirmModal title={t('confirm_action')} msg={t(`confirm_${act}`)} onNo={closeModal} onYes={async () => {
      closeModal()
      const r = await api('POST', 'instance/action', { productId: ts.id, action: act })
      if (apiOk(r)) addToast(t(`success_${act}`), 'success')
      else addToast(t('error_action'), 'error')
    }} />)
  }

  const resetPass = () => {
    showModal(<ConfirmModal title={t('ts_admin_pass')} msg="Generate a new admin password?" onNo={closeModal} onYes={async () => {
      closeModal()
      const r = await api('POST', 'instance/passwd', { productId: ts.id })
      if (apiOk(r)) {
        const pw = r.data?.password || ''
        showModal(
          <div className="modal">
            <div className="modal-header"><h3>New Password</h3></div>
            <div className="modal-body">
              <p style={{fontSize:13,color:'var(--text-mid)',marginBottom:12}}>Save this password — it won't be shown again.</p>
              <div className="form-group">
                <input type="text" readOnly value={pw} style={{fontFamily:'monospace'}} onClick={e => e.target.select()} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(pw); addToast(t('copied'),'success',1500); closeModal() }}>
                <Ic ic={icons.copy} sz={14} /> Copy & Close
              </button>
            </div>
          </div>
        )
      } else addToast(t('error_action'), 'error')
    }} />)
  }

  const showAddWlModal = () => {
    let ip = ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('ts_whitelist')}</h3></div>
        <div className="modal-body">
          <div className="form-group"><label>IP Address</label>
            <input type="text" placeholder="1.2.3.4" onChange={e => ip = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            if (!ip) return
            const r = await api('POST', 'instance/whitelist', { productId: ts.id, ipAddress: ip })
            if (apiOk(r)) { addToast(t('success_save'), 'success'); closeModal(); load() }
            else addToast(t('error_action'), 'error')
          }}>Add</button>
        </div>
      </div>
    )
  }

  const removeWl = ipStr => {
    showModal(<ConfirmModal title="Remove IP" msg={t('confirm_delete')} danger onNo={closeModal} onYes={async () => {
      closeModal()
      await api('DELETE', 'instance/whitelist', { productId: ts.id, ipAddress: ipStr })
      addToast(t('success_save'), 'success')
      load()
    }} />)
  }

  const copy = text => { navigator.clipboard.writeText(text); addToast(t('copied'), 'success', 1500) }

  return (
    <>
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={onBack}><Ic ic={icons.chevron} sz={16} /> {t('back')}</button>
          <h1 style={{marginTop:0}}>{ts.customName || ts.name || ts.id}</h1>
          <p><StatusBadge status={srvState} /></p>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="action-bar" style={{marginBottom:20}}>
          <button className="btn btn-green btn-sm" disabled={isRunning} onClick={() => action('start')}><Ic ic={icons.power} sz={14} /> {t('start')}</button>
          <button className="btn btn-terra btn-sm" disabled={!isRunning} onClick={() => action('stop')}><Ic ic={icons.power} sz={14} /> {t('stop')}</button>
          <div className="separator" />
          <button className="btn btn-ghost btn-sm" onClick={resetPass}><Ic ic={icons.lock} sz={14} /> {t('ts_admin_pass')}</button>
        </div>
        <div className="grid-2">
          <div className="card card-p">
            <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-mid)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:12}}>Connection</h3>
            <div className="info-grid">
              <div className="info-item"><label>Host</label>
                <span className="mono">{d.ipAddress || '—'} {d.ipAddress && <button className="copy-btn" onClick={() => copy(d.ipAddress)}><Ic ic={icons.copy} sz={13}/></button>}</span>
              </div>
              <div className="info-item"><label>Port range</label>
                <span className="mono">{d.port ? `${d.port.from}–${d.port.to}` : '—'}</span>
              </div>
              <div className="info-item"><label>Query Port</label><span className="mono">{d.queryPort || '—'}</span></div>
              {d.username && <div className="info-item"><label>Username</label>
                <span className="mono">{d.username} <button className="copy-btn" onClick={() => copy(d.username)}><Ic ic={icons.copy} sz={13}/></button></span>
              </div>}
            </div>
          </div>
          <div className="card card-p">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-mid)',textTransform:'uppercase',letterSpacing:'.04em'}}>{t('ts_whitelist')}</h3>
              <button className="btn btn-primary btn-sm" onClick={showAddWlModal}><Ic ic={icons.plus} sz={14} /> Add IP</button>
            </div>
            {wl.length ? wl.map((ip, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <span className="mono">{ip}</span>
                <button className="btn btn-icon btn-sm" onClick={() => removeWl(ip)}><Ic ic={icons.trash} sz={14} /></button>
              </div>
            )) : <p style={{color:'var(--text-muted)',fontSize:13}}>No whitelisted IPs</p>}
          </div>
        </div>
      </div>
    </>
  )
}

export default function TeamSpeak() {
  const { t, api, cached, clearCache } = useApp()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sort, setSort] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setItems(filterByType(parseProducts(r), 'teamspeak'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <TSDetail ts={selected} onBack={() => setSelected(null)} />

  const displayed = applyListControls(items, sort, statusFilter)

  return (
    <>
      <div className="page-header">
        <div><h1>{t('teamspeak')}</h1><p>{t('teamspeak_desc')}</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <>
            <ListControls sort={sort} setSort={setSort} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
            <div className="card">
              {displayed.length ? displayed.map(ts => (
                <div key={ts.id} className="product-row" onClick={() => setSelected(ts)}>
                  <div className="product-row-icon" style={{background:'var(--terra-l)',color:'var(--terra-d)'}}><Ic ic={icons.headphones} sz={18} /></div>
                  <div className="product-row-main">
                    <div className="product-row-name">{ts.customName || ts.id}</div>
                    <div className="product-row-sub">{ts.type || ''}</div>
                  </div>
                  <div className="product-row-right">
                    <ExpiryBadge product={ts} />
                    <StatusBadge status={ts.state || ts.status} />
                    <Ic ic={icons.chevron} sz={16} />
                  </div>
                </div>
              )) : <div className="empty-state"><Ic ic={icons.headphones} sz={44} /><h3>{t('no_teamspeak')}</h3></div>}
            </div>
          </>
        )}
      </div>
    </>
  )
}
