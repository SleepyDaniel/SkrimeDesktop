import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { StatusBadge } from '../components/Shell'
import { greeting, parseProducts, filterByType, prodNav, prodIcon, prodColor } from '../utils/fmt'

export default function Dashboard() {
  const { t, nav, api, cached, clearCache, setUser } = useApp()
  const [products, setProducts] = useState([])
  const [bal, setBal] = useState(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [prods, u] = await Promise.all([
      cached('products', () => api('GET', 'product/all')),
      cached('user', () => api('GET', 'account/user')),
    ])
    const ps = parseProducts(prods)
    setProducts(ps)
    if (u?.data) {
      setUser(u.data)
      const ud = u.data
      setBal(ud.balance?.amount ?? ud.balance?.total ?? null)
      setUsername(ud.username || ud.email || '')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const stats = [
    { icon: 'server', label: t('servers'), count: filterByType(products,'server').length, color: 'var(--blue-l)', iconColor: 'var(--blue-d)', nav: 'servers' },
    { icon: 'cpu', label: t('dedicated'), count: filterByType(products,'dedicated').length, color: '#F0EBF8', iconColor: '#8B6CBF', nav: 'dedicated' },
    { icon: 'globe', label: t('domains'), count: filterByType(products,'domain').length, color: 'var(--green-l)', iconColor: 'var(--green-d)', nav: 'domains' },
    { icon: 'layers', label: t('webspace'), count: filterByType(products,'webspace').length, color: 'var(--amber-l)', iconColor: '#B8871F', nav: 'webspace' },
    { icon: 'headphones', label: t('teamspeak'), count: filterByType(products,'teamspeak').length, color: 'var(--terra-l)', iconColor: 'var(--terra-d)', nav: 'teamspeak' },
    { icon: 'shield', label: t('ssl'), count: filterByType(products,'ssl').length, color: '#F5F0FF', iconColor: '#7C5CBF', nav: 'ssl' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t(greeting())}{username ? `, ${username}` : ''}!</h1>
          <p>{t('overview')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache(); load() }}>
            <Ic ic={icons.refresh} sz={16} /> {t('refresh')}
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-full"><div className="spinner spinner-lg" /></div>
        ) : (
          <>
            <div className="grid-auto" style={{marginBottom:24}}>
              {stats.map(s => (
                <div key={s.nav} className="stat-card" onClick={() => nav(s.nav)}>
                  <div className="stat-card-icon" style={{background:s.color,color:s.iconColor}}>
                    <Ic ic={icons[s.icon]} sz={20} />
                  </div>
                  <div className="stat-card-num">{s.count}</div>
                  <div className="stat-card-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{gap:20}}>
              <div className="card">
                <div className="card-p" style={{borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <h3 style={{fontSize:15,fontWeight:600}}>{t('recent_activity')}</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('products'); load() }}>
                      <Ic ic={icons.refresh} sz={14} />
                    </button>
                  </div>
                </div>
                {products.slice(0,8).length ? products.slice(0,8).map(p => (
                  <div key={p.id} className="product-row" onClick={() => nav(prodNav(p), {id:p.id})}>
                    <div className="product-row-icon" style={{background:prodColor(p.type)}}>
                      <Ic ic={icons[prodIcon(p.type)]} sz={18} />
                    </div>
                    <div className="product-row-main">
                      <div className="product-row-name">{p.customName || p.name || p.domain || p.id}</div>
                      <div className="product-row-sub">{p.type || ''}{p.domain ? ` · ${p.domain}` : ''}</div>
                    </div>
                    <div className="product-row-right">
                      <StatusBadge status={p.state || p.status} />
                      <Ic ic={icons.chevron} sz={16} />
                    </div>
                  </div>
                )) : (
                  <div className="empty-state"><Ic ic={icons.activity} sz={44} /><p>{t('loading')}</p></div>
                )}
              </div>

              <div>
                <div className="balance-card" style={{marginBottom:16}}>
                  <div className="balance-label">{t('balance')}</div>
                  <div className="balance-amount">
                    {bal !== null ? Number(bal).toFixed(2) : '—'} <span className="balance-currency">€</span>
                  </div>
                  <button className="btn" style={{background:'rgba(255,255,255,.15)',color:'#fff',fontSize:13,marginTop:8}} onClick={() => nav('account')}>
                    <Ic ic={icons.creditcard} sz={16} /> {t('transactions')}
                  </button>
                </div>
                <div className="card card-p">
                  <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{t('quick_actions')}</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <button className="btn btn-ghost" style={{justifyContent:'flex-start'}} onClick={() => nav('servers')}>
                      <Ic ic={icons.server} sz={16} /> {t('kvm_servers')}
                    </button>
                    <button className="btn btn-ghost" style={{justifyContent:'flex-start'}} onClick={() => nav('domains')}>
                      <Ic ic={icons.globe} sz={16} /> {t('domains')}
                    </button>
                    <button className="btn btn-ghost" style={{justifyContent:'flex-start'}} onClick={() => nav('account')}>
                      <Ic ic={icons.user} sz={16} /> {t('profile')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
