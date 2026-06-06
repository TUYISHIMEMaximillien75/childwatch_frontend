import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-4 max-w-sm w-full flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {offlineReady ? 'App ready to work offline' : 'New content available'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {offlineReady
              ? 'You can now use Childwatch without an internet connection.'
              : 'Please reload to update the application to the latest version.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {needRefresh && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              onClick={() => updateServiceWorker(true)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </button>
          )}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            onClick={() => close()}
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
