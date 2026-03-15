import { useState } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { ConfirmModal } from '../components/Shell'
import logo from '../assets/logo.png'
import logoWhite from '../assets/logoWhite.png'

export default function Settings() {
  const { t, lang, setLang, theme, setTheme, token, setToken, logout, addToast, clearCache, showModal, closeModal } = useApp()
  const [showKey, setShowKey] = useState(false)
  const [keyVal, setKeyVal] = useState(token)

  const saveKey = () => {
    if (!keyVal.trim()) return
    setToken(keyVal.trim())
    clearCache()
    addToast(t('success_save'), 'success')
  }

  const handleLogout = () => {
    showModal(<ConfirmModal title={t('logout')} msg={t('logout_confirm')} onNo={closeModal} onYes={() => { closeModal(); logout() }} />)
  }

  return (
    <>
      <div className="page-header">
        <div><h1>{t('settings')}</h1></div>
      </div>
      <div className="page-body animate-in">
        <div className="settings-section">

          <h3>{t('appearance')}</h3>
          <div className="card" style={{marginBottom:24}}>
            <div className="settings-item">
              <div>
                <div className="settings-item-label">{t('dark_mode')}</div>
                <div className="settings-item-desc">{t('dark_mode_desc')}</div>
              </div>
              <button className={`toggle ${theme === 'dark' ? 'on' : ''}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
            </div>
          </div>

          <h3>{t('language')}</h3>
          <div className="card" style={{marginBottom:24}}>
            <div className="settings-item">
              <div><div className="settings-item-label">English</div></div>
              <button className={`btn ${lang==='en' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setLang('en')}>
                {lang === 'en' ? <><Ic ic={icons.check} sz={14} /> Active</> : 'Select'}
              </button>
            </div>
            <div className="settings-item">
              <div><div className="settings-item-label">Svenska</div></div>
              <button className={`btn ${lang==='sv' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setLang('sv')}>
                {lang === 'sv' ? <><Ic ic={icons.check} sz={14} /> Aktiv</> : 'Välj'}
              </button>
            </div>
          </div>

          <h3>{t('api_key_manage')}</h3>
          <div className="card card-p" style={{marginBottom:24}}>
            <div className="form-group">
              <label>Current API Key</label>
              <div className="pw-wrap">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyVal}
                  onChange={e => setKeyVal(e.target.value)}
                />
                <button className="pw-toggle" type="button" onClick={() => setShowKey(v => !v)}>
                  <Ic ic={showKey ? icons.eyeoff : icons.eye} sz={16} />
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={saveKey}>
              <Ic ic={icons.check} sz={14} /> {t('save')}
            </button>
          </div>

          <h3>{t('account')}</h3>
          <div className="card" style={{marginBottom:24}}>
            <div className="settings-item">
              <div>
                <div className="settings-item-label">{t('logout')}</div>
                <div className="settings-item-desc">Sign out and clear saved credentials</div>
              </div>
              <button className="btn btn-terra btn-sm" onClick={handleLogout}>
                <Ic ic={icons.logout} sz={14} /> {t('logout')}
              </button>
            </div>
          </div>

          <h3>{t('about')}</h3>
          <div className="about-card">
            <img src={theme === 'dark' ? logoWhite : logo} alt="Skrime" className="about-logo" />
            <p style={{fontSize:13.5,color:'var(--text-mid)',lineHeight:1.6,marginBottom:8}}>
              <strong>Skrime Desktop</strong> — an open source desktop client for{' '}
              <a href="#" onClick={e => { e.preventDefault(); window.sk.openUrl('https://skrime.eu') }}>skrime.eu</a>{' '}
              hosting services.
            </p>
            <p style={{fontSize:12.5,color:'var(--text-muted)',lineHeight:1.6}}>
              Logo and Skrime brand belong to <strong>Skrime</strong>. This project is not officially affiliated with Skrime.
            </p>
            <div className="about-links">
              <a
                href="#"
                className="btn btn-ghost btn-sm"
                onClick={e => { e.preventDefault(); window.sk.openUrl("https://github.com/SleepyDaniel/SkrimeDesktop") }}
              >
                <Ic ic={icons.github} sz={14} /> View on GitHub
              </a>
              <a
                href="#"
                className="btn btn-ghost btn-sm"
                onClick={e => { e.preventDefault(); window.sk.openUrl('https://skrime.eu') }}
              >
                <Ic ic={icons.external} sz={14} /> skrime.eu
              </a>
            </div>
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:16}}>
              Made by <a href="#" onClick={e => { e.preventDefault(); window.sk.openUrl("https://github.com/SleepyDaniel/SkrimeDesktop") }}>SleepyDan</a> — MIT License
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
