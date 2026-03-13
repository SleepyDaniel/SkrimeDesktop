import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { Loading } from '../components/Shell'
import { fmtDate } from '../utils/fmt'

export default function Account() {
  const { t, lang, api, cached, clearCache, setUser } = useApp()
  const [userData, setUserData] = useState(null)
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [u, tx] = await Promise.all([
      cached('user', () => api('GET', 'account/user')),
      cached('txns', () => api('GET', 'account/transactions'), 15000),
    ])
    const ud = u?.data || {}
    setUserData(ud)
    setUser(ud)
    setTxns(tx?.data?.transactions || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <Loading />

  const u = userData || {}, p = u.profile || {}
  const bal = u.balance?.amount ?? u.balance?.total ?? null
  const fn = p.firstname || u.first_name || ''
  const ln = p.lastname || u.last_name || ''
  const displayName = (fn || ln) ? `${fn} ${ln}`.trim() : (u.username || 'User')
  const initials = ((fn || u.username || 'U')[0] + (ln || u.username?.[1] || '?')[0]).toUpperCase()

  return (
    <>
      <div className="page-header">
        <div><h1>{t('account')}</h1></div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { clearCache('user'); clearCache('txns'); load() }}><Ic ic={icons.refresh} sz={14} /> {t('refresh')}</button>
        </div>
      </div>
      <div className="page-body animate-in">
        <div className="grid-2" style={{alignItems:'start'}}>
          <div>
            <div className="card" style={{marginBottom:16}}>
              <div className="account-header">
                <div className="account-avatar">
                  {u.avatar || p.avatar ? <img src={u.avatar || p.avatar} alt="" /> : initials}
                </div>
                <div>
                  <div className="account-name">{displayName}</div>
                  <div className="account-email">{u.email || ''}</div>
                </div>
              </div>
              <div style={{padding:'0 20px 20px'}}>
                <div className="info-grid">
                  <div className="info-item"><label>{t('username')}</label><span>{u.username || '—'}</span></div>
                  <div className="info-item"><label>{t('email')}</label><span>{u.email || '—'}</span></div>
                  <div className="info-item"><label>{t('company')}</label><span>{p.company || '—'}</span></div>
                  <div className="info-item"><label>{t('country')}</label><span>{p.country || '—'}</span></div>
                  <div className="info-item"><label>Member since</label><span>{fmtDate(u.createdAt || u.created_at, lang)}</span></div>
                  <div className="info-item"><label>Role</label><span>{u.role || u.userRole || '—'}</span></div>
                </div>
              </div>
            </div>
            <div className="balance-card">
              <div className="balance-label">{t('balance')}</div>
              <div className="balance-amount">{bal !== null ? Number(bal).toFixed(2) : '—'} <span className="balance-currency">€</span></div>
              {u.balance?.coins && <div style={{marginTop:6,opacity:.7,fontSize:13}}>{u.balance.coins} coins</div>}
            </div>
          </div>
          <div className="card">
            <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
              <h3 style={{fontSize:15,fontWeight:600}}>{t('transactions')}</h3>
            </div>
            <div className="transactions-list">
              {txns.length ? txns.slice(0,20).map((tx, i) => {
                const amt = Number(tx.amount || 0)
                return (
                  <div key={i} className="tx-row">
                    <div className="tx-icon"><Ic ic={amt > 0 ? icons.plus : icons.creditcard} sz={16} /></div>
                    <div className="tx-main">
                      <div className="tx-desc">{tx.description || 'Transaction'}</div>
                      <div className="tx-date">{fmtDate(tx.createdAt || tx.created_at || tx.date, lang)}</div>
                    </div>
                    <div className={`tx-amount ${amt > 0 ? 'pos' : 'neg'}`}>{amt > 0 ? '+' : ''}{amt.toFixed(2)} €</div>
                  </div>
                )
              }) : <div className="empty-state"><Ic ic={icons.creditcard} sz={44} /><h3>{t('no_transactions')}</h3></div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
