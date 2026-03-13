import { useState, useRef } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import logo from '../assets/logo.png'

export default function Login() {
  const { t, lang, setLang, setToken, setUser, nav, addToast, api } = useApp()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const keyRef = useRef(null)

  const doLogin = async () => {
    const key = keyRef.current?.value?.trim()
    if (!key) { keyRef.current?.focus(); return }
    setLoading(true)
    setToken(key)
    const r = await api('GET', 'account/user')
    if (r && (r.state === 'success' || r.data)) {
      setUser(r.data || r)
      nav('dashboard')
    } else {
      addToast(t('error_auth'), 'error')
      setToken('')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Skrime" />
        </div>
        <h1>{t('login_title')}</h1>
        <p>{t('login_sub')}</p>
        <div className="form-group">
          <label htmlFor="api-key-input">{t('api_key')}</label>
          <div className="pw-wrap">
            <input
              id="api-key-input"
              ref={keyRef}
              type={showPw ? 'text' : 'password'}
              placeholder={t('api_key_ph')}
              autoComplete="off"
              defaultValue={localStorage.getItem('token') || ''}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
            />
            <button className="pw-toggle" type="button" onClick={() => setShowPw(v => !v)}>
              <Ic ic={showPw ? icons.eyeoff : icons.eye} sz={16} />
            </button>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{width:'100%',justifyContent:'center',fontSize:15,padding:'12px 20px'}}
          disabled={loading}
          onClick={doLogin}
        >
          {loading ? <><div className="spinner" /> {t('connecting')}</> : t('connect')}
        </button>
        <p className="login-hint">
          {t('get_api_key')} <a href="#" onClick={e => { e.preventDefault(); window.sk.openUrl('https://skrime.eu/api') }}>skrime.eu/api</a>
        </p>
      </div>
    </div>
  )
}
