import { useState, useRef, useCallback, useEffect } from 'react'
import { Ctx } from './ctx'
import { i18n } from './i18n'
import { Shell } from './components/Shell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Servers from './pages/Servers'
import Dedicated from './pages/Dedicated'
import Domains from './pages/Domains'
import Webspace from './pages/Webspace'
import TeamSpeak from './pages/TeamSpeak'
import SSL from './pages/SSL'
import IPv4 from './pages/IPv4'
import Backup from './pages/Backup'
import Account from './pages/Account'
import Settings from './pages/Settings'

const pages = { dashboard: Dashboard, servers: Servers, dedicated: Dedicated, domains: Domains, webspace: Webspace, teamspeak: TeamSpeak, ssl: SSL, ipv4: IPv4, backup: Backup, account: Account, settings: Settings }

let toastId = 0

export default function App() {
  const [view, setView] = useState(localStorage.getItem('token') ? 'dashboard' : 'login')
  const [params, setParams] = useState({})
  const [token, setTokenState] = useState(localStorage.getItem('token') || '')
  const [lang, setLangState] = useState(localStorage.getItem('lang') || 'en')
  const [user, setUser] = useState(null)
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'light')

  const tokenRef = useRef(token)
  const cacheRef = useRef({})

  const t = k => (i18n[lang] || i18n.en)[k] || i18n.en[k] || k

  const setLang = l => { setLangState(l); localStorage.setItem('lang', l) }

  const setTheme = t => { setThemeState(t); localStorage.setItem('theme', t) }
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  const setToken = tk => {
    setTokenState(tk)
    tokenRef.current = tk
    if (tk) localStorage.setItem('token', tk)
    else localStorage.removeItem('token')
  }

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
    cacheRef.current = {}
    setView('login')
    setParams({})
  }, [])

  const addToast = (msg, type = 'info', dur = 3500) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), dur)
  }

  const api = useCallback(async (method, ep, body) => {
    try {
      const r = await window.sk.api(method, ep, body, tokenRef.current)
      if (r?.statusCode === 401 || r?.statusCode === 403) { logout(); return null }
      return r
    } catch (e) {
      addToast(e.message || 'Failed to load data', 'error')
      return null
    }
  }, [logout])

  const cached = useCallback(async (key, fn, ttl = 30000) => {
    const c = cacheRef.current[key]
    if (c && Date.now() - c.ts < ttl) return c.data
    const d = await fn()
    if (d) cacheRef.current[key] = { data: d, ts: Date.now() }
    return d
  }, [])

  const clearCache = useCallback(k => {
    if (k) delete cacheRef.current[k]
    else cacheRef.current = {}
  }, [])

  const nav = (v, p = {}) => { setView(v); setParams(p) }

  const showModal = node => setModal(node)
  const closeModal = () => setModal(null)

  const ctx = { view, params, token, setToken, lang, t, setLang, theme, setTheme, user, setUser, nav, logout, addToast, api, cached, clearCache, showModal, closeModal }

  const Page = pages[view] || Dashboard

  const icons_svg = {
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="3"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  }

  return (
    <Ctx.Provider value={ctx}>
      {view === 'login' ? (
        <Login />
      ) : (
        <Shell>
          <Page params={params} />
        </Shell>
      )}

      <div id="toasts">
        {toasts.map(toast => {
          const ic = toast.type === 'success' ? icons_svg.check : toast.type === 'error' ? icons_svg.x : icons_svg.info
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span className="ic" style={{width:16,height:16,flexShrink:0}} dangerouslySetInnerHTML={{__html:ic}} />
              <span>{toast.msg}</span>
            </div>
          )
        })}
      </div>

      {modal && (
        <>
          <div id="overlay" onClick={closeModal} />
          {modal}
        </>
      )}
    </Ctx.Provider>
  )
}
