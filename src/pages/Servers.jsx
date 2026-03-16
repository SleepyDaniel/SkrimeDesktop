import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge, Loading, ConfirmModal, ExpiryBadge, ListControls } from '../components/Shell'
import { LogsTab, AccessTab } from '../components/ProductTabs'
import { fmtDate, fmtBytes, parseProducts, filterByType, applyListControls } from '../utils/fmt'

function ServerDetail({ server, onBack }) {
  const { t, api, cached, clearCache, addToast, showModal, closeModal } = useApp()
  const [info, setInfo] = useState({})
  const [net, setNet] = useState({})
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [tab, setTab] = useState('overview')

  const load = async () => {
    setLoading(true)
    const [i, n, s] = await Promise.all([
      cached(`srv-info-${server.id}`,  () => api('GET', 'server/information', { productId: server.id }), 5000),
      cached(`srv-net-${server.id}`,   () => api('GET', 'server/network',     { productId: server.id })),
      cached(`srv-stats-${server.id}`, () => api('GET', 'server/statistic',   { productId: server.id, period: 'hour' }), 5000),
    ])
    setInfo(i?.data || {}); setNet(n?.data || {}); setStats(s?.data || {})
    setLoading(false)
  }
  useEffect(() => { load() }, [server.id])

  if (loading) return <Loading />

  const d = info

  const srvIp = d.ipv4 || ''
  const srvIpv6 = d.ipv6 || ''
  const srvOs = d.os || ''
  const srvStatus = d.status || server.state || server.status || ''
  const srvUsername = d.username || ''
  const srvPassword = d.password || ''
  const cpuPct = Math.min(100, parseFloat(d.coresUsed) || 0)   
  const memUsedGB = parseFloat(d.memoryUsed) || 0
  const diskUsedGB = parseFloat(d.diskUsed)   || 0

  const netIpv4 = Array.isArray(net.ipv4) ? net.ipv4[0] : null
  const netIpv6 = Array.isArray(net.ipv6) ? net.ipv6[0] : null
  const netIpv4Addr = netIpv4?.ipAddress?.split('/')[0] || srvIp
  const netIpv6Addr = netIpv6?.ipAddress?.split('/')[0] || srvIpv6
  const netGateway = netIpv4?.gateway || ''
  const netHostname = netIpv4?.hostname || ''

  const latestStat = (stats.statistics || []).slice(-1)[0] || {}
  const statCpuPct = Math.min(100, parseFloat(latestStat.cpu) || cpuPct)
  const statMemGB = parseFloat(latestStat.memory) || memUsedGB

  const srvCreated = server.createdAt || server.created
  const srvExpire = server.expireAt  || server.expire

  const isRunning = ['running', 'online', 'started', 'active'].includes(srvStatus.toLowerCase())

  const pct = v => (
    <div className="progress-bar">
      <div className={`progress-fill ${v > 80 ? 'red' : v > 60 ? 'amber' : ''}`} style={{ width: `${v}%` }} />
    </div>
  )

  const action = act => {
    showModal(<ConfirmModal title={t('confirm_action')} msg={t(`confirm_${act}`)} onNo={closeModal} onYes={async () => {
      closeModal()
      await api('POST', 'server/action', { productId: server.id, action: act })
      addToast(t(`success_${act}`), 'success')
      clearCache(`srv-info-${server.id}`)
    }} />)
  }

  const openConsole = async () => {
    const r = await api('GET', 'server/novnc', { productId: server.id })
    const url = r?.data?.url || (typeof r?.data === 'string' ? r.data : null)
    if (url) window.sk.openConsole(url)
    else addToast(t('error_action'), 'error')
  }

  const copy = text => { navigator.clipboard.writeText(text); addToast(t('copied'), 'success', 1500) }

  const showRdnsModal = () => {
    let val = netHostname || ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('set_rdns')}</h3></div>
        <div className="modal-body">
          <div className="form-group"><label>PTR Record</label>
            <input type="text" defaultValue={val} placeholder="server1.example.com"
              onChange={e => val = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            const r = await api('POST', 'server/rdns', { productId: server.id, ipAddress: srvIp, hostname: val })
            if (r?.statusCode === 200) { addToast(t('success_save'), 'success'); clearCache(`srv-net-${server.id}`) }
            else addToast(t('error_action'), 'error')
            closeModal()
          }}>{t('save')}</button>
        </div>
      </div>
    )
  }

  const showRenameModal = () => {
    let val = server.customName || server.name || ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('rename')}</h3></div>
        <div className="modal-body">
          <div className="form-group"><label>{t('rename')}</label>
            <input type="text" defaultValue={val} maxLength={50} onChange={e => val = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            const r = await api('POST', 'product/name', { productId: server.id, name: val })
            if (r?.statusCode === 200 || r?.state === 'success') { addToast(t('success_save'), 'success'); clearCache('products') }
            else addToast(t('error_action'), 'error')
            closeModal()
          }}>{t('save')}</button>
        </div>
      </div>
    )
  }

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
            const r = await api('POST', 'server/passwd', { productId: server.id, password: pw })
            if (r?.statusCode === 200) addToast(t('password_updated'), 'success')
            else addToast(t('error_action'), 'error')
            closeModal()
          }}>{t('save')}</button>
        </div>
      </div>
    )
  }

  const showReinstallModal = async () => {
    const osRes = await api('GET', 'server/os', { productId: server.id })
    const osList = osRes?.data || []
    let osName = osList[0]?.proxmoxId || '', pw = ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('reinstall')}</h3></div>
        <div className="modal-body">
          <p style={{color:'var(--terra-d)',fontSize:13,marginBottom:14}}>⚠️ {t('confirm_reinstall')}</p>
          <div className="form-group"><label>{t('os')}</label>
            <select defaultValue={osName} onChange={e => osName = e.target.value}>
              {osList.map(o => <option key={o.id} value={o.proxmoxId}>{o.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>{t('new_password')} (min. 8)</label>
            <input type="password" minLength={8} onChange={e => pw = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-terra" onClick={async () => {
            if (pw.length < 8) { addToast('Password must be at least 8 characters', 'error'); return }
            const r = await api('DELETE', 'server/reinstall', { productId: server.id, osName, password: pw })
            if (r?.statusCode === 200) addToast(t('success_save'), 'success')
            else addToast(t('error_action'), 'error')
            closeModal()
          }}>{t('reinstall')}</button>
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
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache(`srv-info-${server.id}`); clearCache(`srv-net-${server.id}`); clearCache(`srv-stats-${server.id}`); load() }}>
            <Ic ic={icons.refresh} sz={14} />
          </button>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="tabs" style={{marginBottom:20}}>
          <button className={`tab-btn${tab==='overview'?' active':''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab-btn${tab==='logs'?' active':''}`} onClick={() => setTab('logs')}>{t('logs')}</button>
          <button className={`tab-btn${tab==='access'?' active':''}`} onClick={() => setTab('access')}>{t('access')}</button>
        </div>
        {tab === 'logs' && <LogsTab productId={server.id} />}
        {tab === 'access' && <AccessTab productId={server.id} />}
        {tab !== 'overview' ? null : <div className="detail-panel">
          <div>
            <div className="action-bar" style={{marginBottom:20}}>
              <button className="btn btn-green btn-sm" disabled={isRunning} onClick={() => action('start')}><Ic ic={icons.power} sz={14} /> {t('start')}</button>
              <button className="btn btn-terra btn-sm" disabled={!isRunning} onClick={() => action('stop')}><Ic ic={icons.power} sz={14} /> {t('stop')}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => action('restart')}><Ic ic={icons.refresh} sz={14} /> {t('restart')}</button>
              <div className="separator" />
              <button className="btn btn-ghost btn-sm" onClick={openConsole}><Ic ic={icons.terminal} sz={14} /> {t('console')}</button>
            </div>
            <div className="card card-p detail-section">
              <div className="detail-section"><h3>Info</h3>
                <div className="info-grid">
                  <div className="info-item"><label>{t('ip_address')}</label>
                    <span className="mono">{srvIp || '—'} {srvIp && <button className="copy-btn" onClick={() => copy(srvIp)}><Ic ic={icons.copy} sz={13}/></button>}</span>
                  </div>
                  <div className="info-item"><label>{t('os')}</label><span>{srvOs || '—'}</span></div>
                  {srvUsername && <div className="info-item"><label>Username</label>
                    <span className="mono">{srvUsername} <button className="copy-btn" onClick={() => copy(srvUsername)}><Ic ic={icons.copy} sz={13}/></button></span>
                  </div>}
                  {srvPassword && <div className="info-item"><label>Password</label>
                    <span className="mono" style={{display:'flex',alignItems:'center',gap:6}}>
                      {showPassword ? srvPassword : '••••••••'}
                      <button className="copy-btn" onClick={() => setShowPassword(v => !v)}><Ic ic={showPassword ? icons.eyeoff : icons.eye} sz={13}/></button>
                      <button className="copy-btn" onClick={() => copy(srvPassword)}><Ic ic={icons.copy} sz={13}/></button>
                    </span>
                  </div>}
                  <div className="info-item"><label>{t('created')}</label><span>{fmtDate(srvCreated)}</span></div>
                  <div className="info-item"><label>{t('expires')}</label><span>{fmtDate(srvExpire)}</span></div>
                </div>
              </div>
            </div>
            <div className="card card-p" style={{marginTop:16}}>
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
          <div>
            <div className="card card-p" style={{marginBottom:16}}>
              <button className="novnc-btn" onClick={openConsole}><Ic ic={icons.terminal} sz={18} /> {t('console')}</button>
            </div>
            <div className="card card-p">
              <div className="detail-section"><h3>{t('stats')}</h3>
                <div className="stat-row"><span className="stat-row-label">{t('cpu_usage')}</span><div className="stat-row-bar">{pct(statCpuPct)}</div><span className="stat-row-val">{statCpuPct.toFixed(1)}%</span></div>
                <div className="stat-row"><span className="stat-row-label">{t('ram_usage')}</span><div className="stat-row-bar">{pct(0)}</div><span className="stat-row-val">{statMemGB > 0 ? fmtBytes(statMemGB * 1024 * 1024 * 1024) : '—'}</span></div>
                {diskUsedGB > 0 && <div className="stat-row"><span className="stat-row-label">Disk Used</span><div className="stat-row-bar">{pct(0)}</div><span className="stat-row-val">{fmtBytes(diskUsedGB * 1024 * 1024 * 1024)}</span></div>}
              </div>
            </div>
            <div className="card card-p" style={{marginTop:16}}>
              <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-mid)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:12}}>{t('actions')}</h3>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <button className="btn btn-ghost" style={{justifyContent:'flex-start',fontSize:13}} onClick={showRenameModal}><Ic ic={icons.edit} sz={14} /> {t('rename')}</button>
                <button className="btn" style={{justifyContent:'flex-start',fontSize:13,background:'var(--terra-l)',color:'var(--terra-d)',border:'1px solid var(--terra)'}} onClick={showReinstallModal}><Ic ic={icons.refresh} sz={14} /> {t('reinstall')}</button>
                <button className="btn" style={{justifyContent:'flex-start',fontSize:13,background:'var(--terra-l)',color:'var(--terra-d)',border:'1px solid var(--terra)'}} onClick={showPasswordModal}><Ic ic={icons.lock} sz={14} /> {t('change_password')}</button>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </>
  )
}

export default function Servers() {
  const { t, api, cached, clearCache } = useApp()
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sort, setSort] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await cached('products', () => api('GET', 'product/all'))
    setServers(filterByType(parseProducts(r), 'server'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (selected) return <ServerDetail server={selected} onBack={() => { clearCache(`srv-info-${selected.id}`); setSelected(null) }} />

  const displayed = applyListControls(servers, sort, statusFilter)

  return (
    <>
      <div className="page-header">
        <div><h1>{t('kvm_servers')}</h1><p>{t('kvm_desc')}</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        {loading ? <Loading /> : (
          <>
            <ListControls sort={sort} setSort={setSort} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
            <div className="card">
              {displayed.length ? displayed.map(s => (
                <div key={s.id} className="product-row" onClick={() => setSelected(s)}>
                  <div className="product-row-icon" style={{background:'var(--blue-l)',color:'var(--blue-d)'}}><Ic ic={icons.server} sz={18} /></div>
                  <div className="product-row-main">
                    <div className="product-row-name">{s.customName || s.name || s.id}</div>
                    <div className="product-row-sub mono">{s.type || ''}</div>
                  </div>
                  <div className="product-row-right">
                    <ExpiryBadge product={s} />
                    <StatusBadge status={s.state || s.status} />
                    <Ic ic={icons.chevron} sz={16} />
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <Ic ic={icons.server} sz={44} />
                  <h3>{t('no_servers')}</h3>
                  <p>{t('no_servers_sub')}</p>
                  <a href="#" className="btn btn-primary" style={{marginTop:8}} onClick={e => { e.preventDefault(); window.sk.openUrl('https://skrime.eu/') }}><Ic ic={icons.plus} sz={16} /> Order Server</a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
