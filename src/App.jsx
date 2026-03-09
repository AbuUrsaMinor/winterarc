import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './App.css'

function App() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="snowflake">❄</div>
        <h1>Winterarc</h1>
        <p className="tagline">Your progressive web app is ready</p>
      </header>

      <main className="app-main">
        <div className="cards">
          <div className="card">
            <span className="card-icon">📱</span>
            <h2>Installable</h2>
            <p>Add to your home screen for a native app experience</p>
          </div>
          <div className="card">
            <span className="card-icon">🔌</span>
            <h2>Offline Ready</h2>
            <p>Works without an internet connection after first load</p>
          </div>
          <div className="card">
            <span className="card-icon">⚡</span>
            <h2>Fast</h2>
            <p>Assets cached via service worker for instant loads</p>
          </div>
        </div>

        {!isInstalled && installPrompt && (
          <button className="install-btn" onClick={handleInstall}>
            ➕ Install App
          </button>
        )}

        {needRefresh && (
          <div className="update-banner">
            <span>New version available!</span>
            <button onClick={() => updateServiceWorker(true)}>Update now</button>
            <button onClick={() => setNeedRefresh(false)}>Dismiss</button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built with React + Vite + PWA · Deployed to GitHub Pages</p>
      </footer>
    </div>
  )
}

export default App
