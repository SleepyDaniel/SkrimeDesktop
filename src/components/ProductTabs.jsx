import { useState, useEffect } from 'react'
import { useApp } from '../ctx'
import { icons, Ic } from '../utils/icons'
import { fmtDate } from '../utils/fmt'
import { ConfirmModal } from './Shell'

export function LogsTab({ productId }) {
  const { t, api } = useApp()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('GET', 'product/log', { productId }).then(r => {
      setLogs(r?.data?.logs || [])
      setLoading(false)
    })
  }, [productId])

  if (loading) return <div className="loading-full" style={{minHeight:120}}><div className="spinner" /></div>

  if (!logs.length) return (
    <div className="empty-state" style={{padding:'40px 20px'}}>
      <Ic ic={icons.clock} sz={36} />
      <p>{t('no_logs')}</p>
    </div>
  )

  return (
    <div className="card" style={{marginTop:0}}>
      {logs.map(log => (
        <div key={log.id} className="log-row">
          <div className="log-row-icon"><Ic ic={icons.clock} sz={14} /></div>
          <div className="log-row-main">
            <div className="log-row-msg">{log.message}</div>
            <div className="log-row-meta">{log.username} · {fmtDate(log.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AccessTab({ productId }) {
  const { t, api, addToast, showModal, closeModal } = useApp()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api('GET', 'product/rights', { productId }).then(r => {
      setUsers(r?.data?.users || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [productId])

  const removeUser = (userId) => {
    showModal(
      <ConfirmModal
        title={t('remove_user')}
        msg={t('confirm_remove_user')}
        danger
        onNo={closeModal}
        onYes={async () => {
          closeModal()
          const r = await api('DELETE', 'product/rights', { productId, userId })
          if (r?.state === 'success') { addToast(t('success_save'), 'success'); load() }
          else addToast(t('error_action'), 'error')
        }}
      />
    )
  }

  const showAddModal = () => {
    let userId = '', description = ''
    showModal(
      <div className="modal">
        <div className="modal-header"><h3>{t('add_user')}</h3></div>
        <div className="modal-body">
          <div className="form-group">
            <label>{t('user_id')}</label>
            <input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" onChange={e => userId = e.target.value} />
          </div>
          <div className="form-group">
            <label>{t('role_desc')} (max 25)</label>
            <input type="text" maxLength={25} placeholder="Helper" onChange={e => description = e.target.value} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={async () => {
            if (!userId.trim()) { addToast(t('user_id') + ' required', 'error'); return }
            const r = await api('POST', 'product/rights', { productId, userId: userId.trim(), description: description.trim() })
            if (r?.state === 'success') { addToast(t('success_save'), 'success'); load() }
            else addToast(t('error_action'), 'error')
            closeModal()
          }}>{t('add_user')}</button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading-full" style={{minHeight:120}}><div className="spinner" /></div>

  return (
    <>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <button className="btn btn-ghost btn-sm" onClick={showAddModal}>
          <Ic ic={icons.plus} sz={14} /> {t('add_user')}
        </button>
      </div>
      <div className="card">
        {users.length ? users.map(u => (
          <div key={u.userId} className="user-rights-row">
            <img
              className="user-rights-avatar"
              src={u.avatar || ''}
              onError={e => { e.target.style.display='none' }}
              alt=""
            />
            <div className="user-rights-main">
              <div className="user-rights-name">{u.username}</div>
              {u.description && <div className="user-rights-role">{u.description}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" style={{color:'var(--terra-d)'}} onClick={() => removeUser(u.userId)}>
              <Ic ic={icons.trash} sz={13} /> {t('remove_user')}
            </button>
          </div>
        )) : (
          <div className="empty-state" style={{padding:'40px 20px'}}>
            <Ic ic={icons.users} sz={36} />
            <p>{t('no_users')}</p>
          </div>
        )}
      </div>
    </>
  )
}
