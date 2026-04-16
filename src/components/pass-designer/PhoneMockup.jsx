export default function PhoneMockup({ children }) {
  return (
    <div className="pd-phone">
      <div className="pd-phone-screen">
        <div className="pd-phone-island" />
        <div className="pd-phone-status">
          <span>9:41</span>
          <div className="pd-phone-status-icons">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 11h2v3H1zM5 8h2v6H5zM9 5h2v9H9zM13 2h2v12h-2z"/></svg>
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C5.5 3 3.3 4 1.7 5.7l1.4 1.4C4.5 5.7 6.1 5 8 5s3.5.7 4.9 2.1l1.4-1.4C12.7 4 10.5 3 8 3zm0 4c-1.4 0-2.6.5-3.5 1.4l1.4 1.4c.6-.6 1.3-.8 2.1-.8s1.5.3 2.1.8l1.4-1.4C10.6 7.5 9.4 7 8 7zm0 4c-.5 0-1 .2-1.4.6L8 13l1.4-1.4C9 11.2 8.5 11 8 11z"/></svg>
            <svg viewBox="0 0 20 12" fill="currentColor"><rect x="0" y="1" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="13" height="7" rx="1" /><rect x="17" y="4" width="2.5" height="4" rx="1" /></svg>
          </div>
        </div>
        <div className="pd-phone-content">
          {children}
        </div>
      </div>
    </div>
  )
}
