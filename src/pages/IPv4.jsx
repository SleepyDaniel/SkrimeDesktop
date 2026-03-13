import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading } from '../components/Shell'
import { parseProducts, filterByType, apiOk } from '../utils/fmt'

function IPv4Detail({ ip, onBack }) {
  const { t, api, addToast, showModal, closeModal } = useApp()
  const [net, setNet] = useState({})
  const [blacklist, setBlacklist] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [n, bl] = await Promise.all([
      api('GET', 'ipv4/network',   { productId: ip.id }),
      api('GET', 'ipv4/blacklist', { productId: ip.id }),
    ])
    setNet(n?.data || {})
    setBlacklist(bl?.data?.blacklist || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [ip.id])

  if (loading) return <Loading />
  const n = net
  const addrs = n.addresses || []
  const primaryIp = addrs[0]?.ip || ''
  const isBlacklisted = blacklist.some(x => x.listed?.length > 0)

  const copy = text => { navigator.clipboard.writeText(text); addToast(t('copied'), 'success', 1500) }

  const showRdnsModal = (addr) => {
    let val = addr.hostname || ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('set_rdns')} — {addr.ip}</h3></div>
        <div className="modal-body">
          <div className="form-group"><label>PTR Record</label>
            <input type="text" defaultValue={val} placeholder="host.example.com" onChange={e => val = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            const r = await api('POST', 'ipv4/rdns', { productId: ip.id, ipAddress: addr.ip, hostname: val })
            if (apiOk(r)) { addToast(t('success_save'), 'success'); load() }
            else addToast(t('error_action'), 'error')
            closeModal()
          }}>{t('save')}</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={onBack}><Ic ic={icons.chevron} sz={16} /> {t('back')}</button>
          <h1 style={{marginTop:0}} className="mono">{n.prefix || primaryIp || ip.customName || ip.id}</h1>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="grid-2">
          <div className="card card-p">
            <div className="info-grid">
              <div className="info-item"><label>Prefix</label>
                <span className="mono">{n.prefix || '—'} {n.prefix && <button className="copy-btn" onClick={() => copy(n.prefix)}><Ic ic={icons.copy} sz={13}/></button>}</span>
              </div>
              <div className="info-item"><label>Default rDNS</label><span>{n.standardRdns || '—'}</span></div>
              <div className="info-item"><label>RBL Status</label>
                <span>{isBlacklisted
                  ? <span className="badge badge-red">Blacklisted</span>
                  : <span className="badge badge-green">Clean</span>}
                </span>
              </div>
            </div>
          </div>
          <div className="card card-p">
            <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-mid)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:12}}>Addresses</h3>
            {addrs.length ? addrs.map((a, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <span className="mono" style={{fontSize:13}}>{a.ip}</span>
                  {a.hostname && <div style={{fontSize:11,color:'var(--text-muted)'}}>{a.hostname}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => showRdnsModal(a)}>{t('set_rdns')}</button>
              </div>
            )) : <p style={{color:'var(--text-muted)',fontSize:13}}>No addresses</p>}
          </div>
        </div>

        {isBlacklisted && (
          <div className="card card-p" style={{marginTop:16}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'var(--terra-d)',marginBottom:12}}>Blacklist Details</h3>
            {blacklist.filter(x => x.listed?.length > 0).map((entry, i) => (
              <div key={i} style={{marginBottom:8}}>
                <div className="mono" style={{fontSize:13,marginBottom:4}}>{entry.ip}</div>
                {entry.listed.map((l, j) => (
                  <div key={j} style={{fontSize:12,color:'var(--text-muted)',paddingLeft:12}}>
                    {l.rbl} — <a href={l.delist} target="_blank" rel="noopener noreferrer" style={{color:'var(--blue-d)'}}>Delist</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function IPv4() {
  const { t, api, cached, clearCache } = useApp()
  const [ips, setIps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setIps(filterByType(parseProducts(r), 'ipv4'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <IPv4Detail ip={selected} onBack={() => setSelected(null)} />

  return (
    <>
      <div className="page-header">
        <div><h1>{t('ipv4')}</h1><p>Manage your IPv4 networks</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <div className="card">
            {ips.length ? ips.map(ip => (
              <div key={ip.id} className="product-row" onClick={() => setSelected(ip)}>
                <div className="product-row-icon" style={{background:'var(--blue-l)',color:'var(--blue-d)'}}><Ic ic={icons.network} sz={18} /></div>
                <div className="product-row-main">
                  <div className="product-row-name mono">{ip.productInfo?.prefix || ip.customName || ip.id}</div>
                  <div className="product-row-sub">{ip.type || ''}</div>
                </div>
                <div className="product-row-right"><StatusBadge status={ip.state || ip.status} /><Ic ic={icons.chevron} sz={16} /></div>
              </div>
            )) : <div className="empty-state"><Ic ic={icons.network} sz={44} /><h3>No IPv4 networks</h3></div>}
          </div>
        )}
      </div>
    </>
  )
}
