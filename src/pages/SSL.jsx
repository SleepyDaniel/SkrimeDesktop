import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading } from '../components/Shell'
import { fmtDate, parseProducts, filterByType } from '../utils/fmt'

function SSLDetail({ cert, onBack }) {
  const { t, api, addToast } = useApp()
  const [info, setInfo] = useState({})
  const [loading, setLoading] = useState(true)
  const formats = ['ZIP','CRT','CSR','CA_BUNDLE','PKCS7']

  useEffect(() => {
    api('GET', 'ssl/information', { productId: cert.id }).then(r => { setInfo(r?.data || {}); setLoading(false) })
  }, [cert.id])

  if (loading) return <Loading />
  const d = info

  const download = async fmt => {
    const r = await api('GET', 'ssl/download', { productId: cert.id, format: fmt })
    const content = r?.data?.content
    if (content) {
      const binary = atob(content)
      const bytes = new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i))
      const blob = new Blob([bytes], { type: r.data.mimeType || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = r.data.filename || `cert_${cert.id}.${fmt.toLowerCase()}`; a.click()
      URL.revokeObjectURL(url)
    } else addToast(t('error_action'), 'error')
  }

  const copy = text => { navigator.clipboard.writeText(text); addToast(t('copied'), 'success', 1500) }

  return (
    <>
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={onBack}><Ic ic={icons.chevron} sz={16} /> {t('back')}</button>
          <h1 style={{marginTop:0}}>{d.domainName || cert.customName || cert.id}</h1>
          <p><StatusBadge status={cert.state || cert.status} /></p>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="grid-2">
          <div className="card card-p">
            <div className="info-grid">
              <div className="info-item"><label>Domain</label><span>{d.domainName || '—'}</span></div>
              <div className="info-item"><label>Algorithm</label><span>{d.publicKeyAlgorithm || '—'} {d.publicKeySize ? `(${d.publicKeySize} bit)` : ''}</span></div>
              <div className="info-item"><label>Fingerprint</label>
                <span className="mono" style={{fontSize:11,wordBreak:'break-all'}}>{d.fingerprint || '—'}
                  {d.fingerprint && <button className="copy-btn" onClick={() => copy(d.fingerprint)} style={{marginLeft:4}}><Ic ic={icons.copy} sz={13}/></button>}
                </span>
              </div>
              <div className="info-item"><label>{t('expires')}</label><span>{fmtDate(cert.expireAt || cert.expire)}</span></div>
            </div>
          </div>
          <div className="card card-p">
            <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{t('download_cert')}</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {formats.map(f => (
                <button key={f} className="btn btn-ghost" style={{justifyContent:'flex-start'}} onClick={() => download(f)}>
                  <Ic ic={icons.download} sz={16} /> {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function SSL() {
  const { t, api, cached, clearCache } = useApp()
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setCerts(filterByType(parseProducts(r), 'ssl'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <SSLDetail cert={selected} onBack={() => setSelected(null)} />

  return (
    <>
      <div className="page-header">
        <div><h1>{t('ssl')}</h1><p>{t('ssl_desc')}</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <div className="card">
            {certs.length ? certs.map(c => (
              <div key={c.id} className="product-row" onClick={() => setSelected(c)}>
                <div className="product-row-icon" style={{background:'#F5F0FF',color:'#7C5CBF'}}><Ic ic={icons.shield} sz={18} /></div>
                <div className="product-row-main">
                  <div className="product-row-name">{c.customName || c.id}</div>
                  <div className="product-row-sub">{t('expires')}: {fmtDate(c.expireAt || c.expire)}</div>
                </div>
                <div className="product-row-right"><StatusBadge status={c.state || c.status} /><Ic ic={icons.chevron} sz={16} /></div>
              </div>
            )) : <div className="empty-state"><Ic ic={icons.shield} sz={44} /><h3>{t('no_ssl')}</h3></div>}
          </div>
        )}
      </div>
    </>
  )
}
