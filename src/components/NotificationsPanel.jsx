import './notifications-panel.css'

export default function NotificationsPanel({ shopId, lang = 'en' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  return (
    <div className="np-locked" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="np-locked-icon">&#128274;</div>
      <h2>{T('Notifications', 'الإشعارات')}</h2>
      <p>{T('Coming Soon', 'قريباً')}</p>
    </div>
  )
}
