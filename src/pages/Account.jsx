import { useState, useEffect, useRef } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { Loading } from '../components/Shell'
import { fmtDate } from '../utils/fmt'

function PaymentView({ url, onClose, t }) {
  const ref = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const wv = ref.current
    if (!wv) return
    const done = () => setLoading(false)
    wv.addEventListener('did-finish-load', done)
    return () => wv.removeEventListener('did-finish-load', done)
  }, [])

  return (
    <div className="payment-view-modal">
      <div className="payment-view-header">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Ic ic={icons.creditcard} sz={16} />
          <span style={{fontWeight:600,fontSize:14}}>Payment</span>
        </div>
        <button className="payment-view-close" onClick={onClose}><Ic ic={icons.x} sz={16} /></button>
      </div>
      {loading && (
        <div className="payment-view-loading">
          <div className="spinner" />
          <span>{t('loading')}</span>
        </div>
      )}
      <webview ref={ref} src={url} style={{flex:1,width:'100%',display:loading?'none':'flex'}} />
    </div>
  )
}

function TopUpModal({ onClose, api, addToast, t, showModal, closeModal }) {
  const [chargeData, setChargeData] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [amount, setAmount] = useState('10.00')
  const [method, setMethod] = useState('')
  const [tos, setTos] = useState(false)
  const [nochargeback, setNochargeback] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('GET', 'account/charge').then(r => {
      if (r?.data) {
        setChargeData(r.data)
        setAmount(r.data.minCharge || '10.00')
        const firstMethod = (r.data.paymentMethods || []).find(m => m.active && m.available)
        if (firstMethod) setMethod(firstMethod.type)
      }
      setLoadingData(false)
    })
  }, [])

  const submit = async () => {
    const amt = parseFloat(amount)
    const min = parseFloat(chargeData?.minCharge || 1)
    const max = parseFloat(chargeData?.maxCharge || 250)
    if (isNaN(amt) || amt < min || amt > max) { addToast(`Amount must be between ${min} and ${max} €`, 'error'); return }
    if (!method) { addToast('Please select a payment method', 'error'); return }
    if (!tos) { addToast('Please accept the Terms of Service', 'error'); return }
    if (!nochargeback) { addToast('Please confirm no chargeback', 'error'); return }
    setSubmitting(true)
    const r = await api('POST', 'account/charge', { action: 'charge', amount: amt.toFixed(2), paymentMethod: method, tos: true, nochargeback: true })
    setSubmitting(false)
    if (r?.data?.paymentUrl) {
      onClose()
      showModal(<PaymentView url={r.data.paymentUrl} onClose={closeModal} t={t} />)
    } else if (r?.data || Number(r?.statusCode) === 200) {
      addToast(r?.response || 'Charge created!', 'success')
      onClose()
    } else {
      addToast(r?.response || 'Failed to create charge', 'error')
    }
  }

  const activeMethods = (chargeData?.paymentMethods || []).filter(m => m.active && m.available)
  const bonus = chargeData?.bonus?.charge
  const bank = chargeData?.bankTransfer
  const min = chargeData?.minCharge || '1.00'
  const max = chargeData?.maxCharge || '250.00'

  return (
    <div className="modal">
      <div className="modal-header">
        <h3>{t('topup_title')}</h3>
      </div>
      <div className="modal-body">
        {loadingData ? (
          <div style={{padding:'24px 0',textAlign:'center',color:'var(--text-muted)'}}>{t('loading')}</div>
        ) : (
          <>
            {bonus?.enabled && (
              <div className="bonus-banner">
                <Ic ic={icons.info} sz={15} />
                {t('topup_bonus_charge').replace('{p}', bonus.percent)}
              </div>
            )}
            <div className="form-group">
              <label>{t('topup_amount')} (€)</label>
              <input type="number" min={min} max={max} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>{t('topup_min_max').replace('{min}', min).replace('{max}', max)} €</div>
            </div>
            {(activeMethods.length > 0 || bank) && (
              <div className="form-group">
                <label>{t('topup_method')}</label>
                <div className="payment-methods">
                  {activeMethods.map(m => (
                    <button key={m.type} className={`payment-method${method === m.type ? ' selected' : ''}`} onClick={() => setMethod(m.type)}>
                      {m.background ? <img src={m.background} alt={m.name} /> : <span>{m.name}</span>}
                    </button>
                  ))}
                  {bank && (
                    <button className={`payment-method${method === '__bank' ? ' selected' : ''}`} onClick={() => setMethod('__bank')}>
                      <span>{t('topup_bank_transfer')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            {method === '__bank' && bank && (
              <div className="bank-transfer-info">
                <div className="info-grid">
                  <div className="info-item"><label>Bank</label><span>{bank.bank}</span></div>
                  <div className="info-item"><label>Account Holder</label><span>{bank.accountHolder}</span></div>
                  <div className="info-item"><label>IBAN</label><span style={{fontFamily:'monospace',fontSize:12}}>{bank.iban}</span></div>
                  <div className="info-item"><label>BIC</label><span style={{fontFamily:'monospace'}}>{bank.bic}</span></div>
                  <div className="info-item"><label>Reference</label><span style={{fontFamily:'monospace'}}>{bank.purpose}</span></div>
                </div>
                {bank.qrCode && (
                  <div style={{marginTop:14,textAlign:'center'}}>
                    <img src={`data:image/png;base64,${bank.qrCode}`} alt="QR" style={{width:110,height:110,borderRadius:8,border:'1px solid var(--border)'}} />
                  </div>
                )}
              </div>
            )}
            {method && method !== '__bank' && (
              <>
                <label className="checkbox-row">
                  <input type="checkbox" checked={tos} onChange={e => setTos(e.target.checked)} />
                  <span>{t('topup_tos')}</span>
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" checked={nochargeback} onChange={e => setNochargeback(e.target.checked)} />
                  <span>{t('topup_no_chargeback')}</span>
                </label>
              </>
            )}
          </>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
        {!loadingData && method && method !== '__bank' && (
          <button className="btn btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? t('loading') : t('topup_pay')}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Account() {
  const { t, lang, api, cached, clearCache, setUser, addToast, showModal, closeModal } = useApp()
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

  const openTopUp = () => showModal(
    <TopUpModal onClose={closeModal} api={api} addToast={addToast} t={t} showModal={showModal} closeModal={closeModal} />
  )

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
              <button className="balance-topup" onClick={openTopUp}>
                <Ic ic={icons.plus} sz={14} /> {t('recharge')}
              </button>
            </div>
          </div>
          <div className="card">
            <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
              <h3 style={{fontSize:15,fontWeight:600}}>{t('transactions')}</h3>
            </div>
            <div className="transactions-list">
              {txns.length ? txns.slice(0,20).map((tx, i) => {
                const amt = Number(tx.amount || 0)
                const pending = tx.state && tx.state !== 'done' && tx.state !== 'success'
                return (
                  <div key={i} className={`tx-row${pending ? ' tx-pending' : ''}`}>
                    <div className="tx-icon"><Ic ic={amt > 0 ? icons.plus : icons.creditcard} sz={16} /></div>
                    <div className="tx-main">
                      <div className="tx-desc">
                        {tx.description || 'Transaction'}
                        {pending && <span className="tx-state-badge">{tx.state}</span>}
                      </div>
                      <div className="tx-date">{fmtDate(tx.createdAt || tx.created_at || tx.date, lang)}</div>
                    </div>
                    <div className={`tx-amount ${pending ? 'muted' : amt > 0 ? 'pos' : 'neg'}`}>{amt > 0 ? '+' : ''}{amt.toFixed(2)} €</div>
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
