import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

export default function Layout() {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="container">
      <header className="header">
        <h1>AI Family Dashboard</h1>
        <button className="btn btn-danger" onClick={logout}>Logout</button>
      </header>
      <nav className="nav">
        <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">Dashboard</Link>
        <Link className={`nav-link ${location.pathname === '/configs' ? 'active' : ''}`} to="/configs">Providers</Link>
        <Link className={`nav-link ${location.pathname === '/keys' ? 'active' : ''}`} to="/keys">Proxy Keys</Link>
        <Link className={`nav-link ${location.pathname === '/usage' ? 'active' : ''}`} to="/usage">Usage</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
