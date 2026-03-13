import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading, ConfirmModal } from '../components/Shell'
import { fmtDate, parseProducts, filterByType, apiOk } from '../utils/fmt'

function DomainDetail({ domain, onBack }) {
  const { t, api, addToast, showModal, closeModal } = useApp()
  const [ns, setNs] = useState([])
  const [dns, setDns] = useState([])
  const [authCode, setAuthCode] = useState('—')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dns')

  const domName = domain.productInfo?.domain || domain.customName || domain.name || ''

  const load = async () => {
    setLoading(true)
    const [nsR, dnsR, authR] = await Promise.all([
      api('GET', 'domain/nameserver', { domain: domName }),
      api('GET', 'domain/dns',        { domain: domName }),
      api('GET', 'domain/authcode',   { domain: domName }),
    ])
    setNs(nsR?.data?.nameserver || [])
    setDns(dnsR?.data?.records || [])
    setAuthCode(authR?.data?.authcode || '—')
    setLoading(false)
  }
  useEffect(() => { if (domName) load() }, [domName])

  if (loading) return <Loading />

  const dnsTypeClass = type => ({ MX: 'mx', TXT: 'txt', CNAME: 'cname' }[type] || '')

  const showAddDns = () => {
    const dnsTypes = ['A','AAAA','CNAME','ALIAS','MX','SRV','TXT','CAA','PTR','TLSA','DS','DNSKEY']
    let rec = { type: 'A', name: '', data: '' }
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('add_record')}</h3></div>
        <div className="modal-body">
          <div className="form-group"><label>{t('dns_type')}</label>
            <select defaultValue="A" onChange={e => rec.type = e.target.value}>
              {dnsTypes.map(ty => <option key={ty} value={ty}>{ty}</option>)}
            </select>
          </div>
          <div className="form-group"><label>{t('dns_name')}</label>
            <input type="text" placeholder="@ or subdomain" onChange={e => rec.name = e.target.value} />
          </div>
          <div className="form-group"><label>{t('dns_content')}</label>
            <input type="text" placeholder="IP address or value" onChange={e => rec.data = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            const updated = [...dns, rec]
            const r = await api('POST', 'domain/dns', { domain: domName, records: updated })
            if (apiOk(r)) { addToast(t('success_save'), 'success'); setDns(r.data?.records || updated); closeModal() }
            else addToast(t('error_action'), 'error')
          }}>{t('save')}</button>
        </div>
      </div>
    )
  }

  const deleteRecord = idx => {
    showModal(<ConfirmModal title={t('delete_record')} msg={t('confirm_delete')} danger onNo={closeModal} onYes={async () => {
      closeModal()
      const updated = dns.filter((_, i) => i !== idx)
      const r = await api('POST', 'domain/dns', { domain: domName, records: updated })
      if (apiOk(r)) { addToast(t('success_save'), 'success'); setDns(r.data?.records || updated) }
      else addToast(t('error_action'), 'error')
    }} />)
  }

  const saveNs = async () => {
    const vals = ns.filter(Boolean)
    if (vals.length < 2) { addToast('Need at least 2 nameservers', 'error'); return }
    const r = await api('POST', 'domain/nameserver', { domain: domName, nameserver: vals })
    if (apiOk(r)) addToast(t('success_save'), 'success')
    else addToast(t('error_action'), 'error')
  }

  return (
    <>
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={onBack}><Ic ic={icons.chevron} sz={16} /> {t('back')}</button>
          <h1 style={{marginTop:0}}>{domName}</h1>
          <p><StatusBadge status={domain.state || domain.status} /> <span style={{color:'var(--text-muted)',fontSize:13,marginLeft:8}}>{t('expires')}: {fmtDate(domain.expireAt || domain.expire)}</span></p>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="tabs">
          {['dns','ns','info'].map(tb => (
            <button key={tb} className={`tab-btn ${tab===tb?'active':''}`} onClick={() => setTab(tb)}>
              {tb === 'dns' ? t('dns_records') : tb === 'ns' ? t('nameservers') : 'Info'}
            </button>
          ))}
        </div>

        {tab === 'dns' && (
          <>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
              <button className="btn btn-primary btn-sm" onClick={showAddDns}><Ic ic={icons.plus} sz={14} /> {t('add_record')}</button>
            </div>
            <div className="card">
              <table className="dns-table">
                <thead><tr>
                  <th style={{width:80}}>{t('dns_type')}</th>
                  <th>{t('dns_name')}</th>
                  <th>{t('dns_content')}</th>
                  <th style={{width:48}} />
                </tr></thead>
                <tbody>
                  {dns.length ? dns.map((rec, i) => (
                    <tr key={i}>
                      <td><span className={`dns-type-badge ${dnsTypeClass(rec.type)}`}>{rec.type}</span></td>
                      <td className="mono">{rec.name}</td>
                      <td className="mono" style={{maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{rec.data}</td>
                      <td><button className="btn btn-icon btn-sm" onClick={e => { e.stopPropagation(); deleteRecord(i) }}><Ic ic={icons.trash} sz={14} /></button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}><div className="empty-state" style={{padding:30}}><Ic ic={icons.globe} sz={44} /><p>{t('no_records')}</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'ns' && (
          <div className="card card-p" style={{maxWidth:480}}>
            {ns.length ? ns.map((n, i) => (
              <div key={i} className="form-group">
                <label>NS {i+1}</label>
                <input type="text" defaultValue={n} onChange={e => {
                  const copy = [...ns]; copy[i] = e.target.value; setNs(copy)
                }} />
              </div>
            )) : <p style={{color:'var(--text-muted)'}}>No nameservers configured</p>}
            <button className="btn btn-primary" onClick={saveNs}>{t('save')} {t('nameservers')}</button>
          </div>
        )}

        {tab === 'info' && (
          <div className="card card-p" style={{maxWidth:480}}>
            <div className="info-grid">
              <div className="info-item"><label>{t('authcode')}</label>
                <span className="mono">{authCode} <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(authCode); addToast(t('copied'),'success',1500) }}><Ic ic={icons.copy} sz={13} /></button></span>
              </div>
              <div className="info-item"><label>{t('expires')}</label><span>{fmtDate(domain.expireAt || domain.expire)}</span></div>
              <div className="info-item"><label>{t('auto_renew')}</label><span>{domain.autoRenew ? '✅' : '❌'}</span></div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function Domains() {
  const { t, api, cached, clearCache } = useApp()
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setDomains(filterByType(parseProducts(r), 'domain'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <DomainDetail domain={selected} onBack={() => setSelected(null)} />

  return (
    <>
      <div className="page-header">
        <div><h1>{t('domains')}</h1><p>{t('domains_desc')}</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <div className="card">
            {domains.length ? domains.map(d => (
              <div key={d.id} className="product-row" onClick={() => setSelected(d)}>
                <div className="product-row-icon" style={{background:'var(--green-l)',color:'var(--green-d)'}}><Ic ic={icons.globe} sz={18} /></div>
                <div className="product-row-main">
                  <div className="product-row-name">{d.productInfo?.domain || d.customName || d.id}</div>
                  <div className="product-row-sub">{t('expires')}: {fmtDate(d.expireAt || d.expire)}</div>
                </div>
                <div className="product-row-right"><StatusBadge status={d.state || d.status} /><Ic ic={icons.chevron} sz={16} /></div>
              </div>
            )) : <div className="empty-state"><Ic ic={icons.globe} sz={44} /><h3>{t('no_domains')}</h3><p>{t('no_domains_sub')}</p></div>}
          </div>
        )}
      </div>
    </>
  )
}
