export function IPhoneFrame({ children }) {
  return (
    <div className="pd-iphone">
      <div className="pd-iphone-btns">
        <span className="pd-iphone-btn-silent" />
        <span className="pd-iphone-btn-vol1" />
        <span className="pd-iphone-btn-vol2" />
        <span className="pd-iphone-btn-power" />
      </div>
      <div className="pd-iphone-screen">
        <div className="pd-iphone-island" />
        <div className="pd-iphone-status">
          <span className="pd-iphone-time">9:41</span>
          <div className="pd-iphone-status-r">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><rect x="0" y="4" width="3" height="8" rx="1" opacity=".3"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity=".5"/><rect x="9" y="1" width="3" height="11" rx="1" opacity=".7"/><rect x="13.5" y="0" width="2.5" height="12" rx="1"/></svg>
            <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 3.6c1.5 0 2.8.6 3.8 1.5l1.1-1.1C11 2.6 9.3 1.8 7.5 1.8S4 2.6 2.6 4l1.1 1.1C4.7 4.2 6 3.6 7.5 3.6zm0 3c.8 0 1.5.3 2 .8l1.1-1.1c-.8-.8-1.9-1.3-3.1-1.3s-2.3.5-3.1 1.3L5.5 7.4c.5-.5 1.2-.8 2-.8zM7.5 9c-.5 0-.9.4-.9.9s.4.9.9.9.9-.4.9-.9-.4-.9-.9-.9z"/></svg>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="currentColor"><rect x=".5" y=".5" width="20" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" fill="none" opacity=".35"/><rect x="2" y="2" width="17" height="8" rx="1.5"/><rect x="22" y="3.5" width="2" height="5" rx="1" opacity=".4"/></svg>
          </div>
        </div>
        <div className="pd-iphone-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export function PixelFrame({ children }) {
  return (
    <div className="pd-pixel">
      <div className="pd-pixel-screen">
        <div className="pd-pixel-cam" />
        <div className="pd-pixel-status">
          <span className="pd-pixel-time">9:41</span>
          <div className="pd-pixel-status-r">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><rect x="0" y="4" width="3" height="8" rx="1" opacity=".3"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity=".5"/><rect x="9" y="1" width="3" height="11" rx="1" opacity=".7"/><rect x="13.5" y="0" width="2.5" height="12" rx="1"/></svg>
            <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 3.6c1.5 0 2.8.6 3.8 1.5l1.1-1.1C11 2.6 9.3 1.8 7.5 1.8S4 2.6 2.6 4l1.1 1.1C4.7 4.2 6 3.6 7.5 3.6zm0 3c.8 0 1.5.3 2 .8l1.1-1.1c-.8-.8-1.9-1.3-3.1-1.3s-2.3.5-3.1 1.3L5.5 7.4c.5-.5 1.2-.8 2-.8zM7.5 9c-.5 0-.9.4-.9.9s.4.9.9.9.9-.4.9-.9-.4-.9-.9-.9z"/></svg>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="currentColor"><rect x=".5" y=".5" width="20" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" fill="none" opacity=".35"/><rect x="2" y="2" width="17" height="8" rx="1.5"/><rect x="22" y="3.5" width="2" height="5" rx="1" opacity=".4"/></svg>
          </div>
        </div>
        <div className="pd-pixel-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function PhoneMockup({ platform, dark, children }) {
  const className = dark ? 'pd-phone-dark' : ''
  if (platform === 'google') return <div className={className}><PixelFrame>{children}</PixelFrame></div>
  return <div className={className}><IPhoneFrame>{children}</IPhoneFrame></div>
}
