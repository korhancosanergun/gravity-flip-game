// Polls /api/version every 5 minutes.
// Shows a reload toast when the server reports a newer version
// than the one baked into this bundle at build time.

const POLL_MS = 5 * 60 * 1000; // 5 minutes

export function startUpdateChecker(): void {
  void poll();
}

async function poll(): Promise<void> {
  await check();
  setTimeout(() => void poll(), POLL_MS);
}

async function check(): Promise<void> {
  try {
    const res = await fetch('/api/version', { cache: 'no-store' });
    if (!res.ok) return;
    const { version } = (await res.json()) as { version: string };
    if (version && version !== __APP_VERSION__) {
      notify(version);
    }
  } catch {
    // offline or network error — ignore silently
  }
}

function notify(newVer: string): void {
  const toast = document.getElementById('update-toast');
  if (!toast || toast.dataset['shown'] === newVer) return;
  toast.dataset['shown'] = newVer;
  toast.classList.add('visible');

  document.getElementById('update-reload')?.addEventListener(
    'click',
    () => {
      // Ask SW to drop its cache so the reload fetches fresh files
      navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_CACHE' });
      setTimeout(() => location.reload(), 150);
    },
    { once: true },
  );

  document.getElementById('update-dismiss')?.addEventListener(
    'click',
    () => toast.classList.remove('visible'),
    { once: true },
  );
}
