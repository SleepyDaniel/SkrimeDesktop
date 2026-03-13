import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading, ConfirmModal } from '../components/Shell'
import { fmtDate, parseProducts, filterByType, apiOk } from '../utils/fmt'

function DedicatedDetail({ server, onBack }) {
  const { t, api, cached, clearCache, addToast, showModal, closeModal } = useApp()
  const [info, setInfo] = useState({})
  const [net, setNet] = useState({})
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [i, n] = await Promise.all([
      cached(`ded-info-${server.id}`, () => api('GET', 'dedicated/information', { productId: server.id }), 5000),
      cached(`ded-net-${server.id}`,  () => api('GET', 'dedicated/network',     { productId: server.id })),
    ])
    setInfo(i?.data || {}); setNet(n?.data || {})
    setLoading(false)
  }
  useEffect(() => { load() }, [server.id])

  if (loading) return <Loading />

  const d = info
  const srvStatus = d.status || server.state || ''
  const isRunning = ['running', 'online', 'started', 'active'].includes(srvStatus.toLowerCase())

  const netIpv4 = Array.isArray(net.ipv4) ? net.ipv4[0] : null
  const netIpv6 = Array.isArray(net.ipv6) ? net.ipv6[0] : null
  const netIpv4Addr = netIpv4?.ipAddress?.split('/')[0] || ''
  const netIpv6Addr = netIpv6?.ipAddress?.split('/')[0] || ''
  const netGateway = netIpv4?.gateway || ''
  const netHostname = netIpv4?.hostname || ''

  const diskStr = Array.isArray(d.disk)
    ? d.disk.map(x => `${x.count}x ${x.size} ${x.type}`).join(', ')
    : (d.disk || '—')

  const copy = text => { navigator.clipboard.writeText(text); addToast(t('copied'), 'success', 1500) }

  const action = act => {
    showModal(<ConfirmModal title={t('confirm_action')} msg={t(`confirm_${act}`)} onNo={closeModal} onYes={async () => {
      closeModal()
      const r = await api('POST', 'dedicated/action', { productId: server.id, action: act })
      if (apiOk(r)) addToast(t(`success_${act}`), 'success')
      else addToast(t('error_action'), 'error')
      clearCache(`ded-info-${server.id}`)
    }} />)
  }

  const openConsole = async () => {
    const r = await api('POST', 'dedicated/novnc', { productId: server.id })
    const url = r?.data?.url
    if (url) window.sk.openConsole(url)
    else addToast(t('error_action'), 'error')
  }

  const showRdnsModal = () => {
    let val = netHostname || ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('set_rdns')}</h3></div>
        <div className="modal-body">
          <div className="form-group"><label>PTR Record</label>
            <input type="text" defaultValue={val} placeholder="server1.example.com" onChange={e => val = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            const r = await api('POST', 'dedicated/rdns', { productId: server.id, ipAddress: netIpv4Addr, hostname: val })
            if (apiOk(r)) { addToast(t('success_save'), 'success'); clearCache(`ded-net-${server.id}`) }
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
          <h1 style={{marginTop:0}}>{server.customName || server.name || server.id}</h1>
          <p><StatusBadge status={srvStatus} /></p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache(`ded-info-${server.id}`); clearCache(`ded-net-${server.id}`); load() }}>
            <Ic ic={icons.refresh} sz={14} />
          </button>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="action-bar" style={{marginBottom:20}}>
          <button className="btn btn-green btn-sm" disabled={isRunning} onClick={() => action('start')}><Ic ic={icons.power} sz={14} /> {t('start')}</button>
          <button className="btn btn-terra btn-sm" disabled={!isRunning} onClick={() => action('stop')}><Ic ic={icons.power} sz={14} /> {t('stop')}</button>
          <div className="separator" />
          <button className="btn btn-ghost btn-sm" onClick={openConsole}><Ic ic={icons.terminal} sz={14} /> {t('console')}</button>
        </div>
        <div className="grid-2">
          <div className="card card-p">
            <div className="detail-section"><h3>Info</h3>
              <div className="info-grid">
                <div className="info-item"><label>{t('ip_address')}</label>
                  <span className="mono">{netIpv4Addr || '—'} {netIpv4Addr && <button className="copy-btn" onClick={() => copy(netIpv4Addr)}><Ic ic={icons.copy} sz={13}/></button>}</span>
                </div>
                <div className="info-item"><label>{t('cpu')}</label><span>{d.cpu || '—'}</span></div>
                <div className="info-item"><label>{t('ram')}</label><span>{d.memory || '—'}</span></div>
                <div className="info-item"><label>Disk</label><span>{diskStr}</span></div>
                <div className="info-item"><label>Uplink</label><span>{d.uplink || '—'}</span></div>
                <div className="info-item"><label>{t('expires')}</label><span>{fmtDate(server.expireAt || server.expire)}</span></div>
              </div>
            </div>
          </div>
          <div className="card card-p">
            <div className="detail-section"><h3>{t('network')}</h3>
              <div className="info-grid">
                <div className="info-item"><label>{t('ipv4_addr')}</label>
                  <span className="mono">{netIpv4Addr || '—'} {netIpv4Addr && <button className="copy-btn" onClick={() => copy(netIpv4Addr)}><Ic ic={icons.copy} sz={13}/></button>}</span>
                </div>
                <div className="info-item"><label>{t('ipv6_addr')}</label>
                  <span className="mono">{netIpv6Addr || '—'} {netIpv6Addr && <button className="copy-btn" onClick={() => copy(netIpv6Addr)}><Ic ic={icons.copy} sz={13}/></button>}</span>
                </div>
                {netGateway && <div className="info-item"><label>{t('gateway')}</label><span className="mono">{netGateway}</span></div>}
                <div className="info-item"><label>{t('rdns')}</label>
                  <span>{netHostname || '—'} <button className="btn btn-ghost btn-sm" style={{marginLeft:6}} onClick={showRdnsModal}>{t('set_rdns')}</button></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Dedicated() {
  const { t, api, cached, clearCache } = useApp()
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setServers(filterByType(parseProducts(r), 'dedicated'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <DedicatedDetail server={selected} onBack={() => { clearCache(`ded-info-${selected.id}`); setSelected(null) }} />

  return (
    <>
      <div className="page-header">
        <div><h1>{t('dedicated_servers')}</h1><p>{t('dedicated_desc')}</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <div className="card">
            {servers.length ? servers.map(s => (
              <div key={s.id} className="product-row" onClick={() => setSelected(s)}>
                <div className="product-row-icon" style={{background:'#F0EBF8',color:'#8B6CBF'}}><Ic ic={icons.cpu} sz={18} /></div>
                <div className="product-row-main">
                  <div className="product-row-name">{s.customName || s.name || s.id}</div>
                  <div className="product-row-sub">{s.type || ''}</div>
                </div>
                <div className="product-row-right"><StatusBadge status={s.state || s.status} /><Ic ic={icons.chevron} sz={16} /></div>
              </div>
            )) : <div className="empty-state"><Ic ic={icons.cpu} sz={44} /><h3>{t('no_dedicated')}</h3></div>}
          </div>
        )}
      </div>
    </>
  )
}
