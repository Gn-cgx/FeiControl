'use client';

import { useCallback, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import Office3D from '@/components/Office3D/Office3D';

const CANVAS_CHECK_INTERVAL_MS = 500;
const CANVAS_BOOT_TIMEOUT_MS = 5000;
const MAX_AUTO_RETRIES = 2;
const shellStyle = { backgroundColor: '#0d1b2a' };

function hasOfficeCanvas() {
  return typeof document !== 'undefined' && Boolean(document.querySelector('.office-3d-root canvas'));
}

export default function OfficeClient() {
  const [mounted, setMounted] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState<'booting' | 'retrying' | 'ready' | 'failed'>('booting');
  const isMobile = useIsMobile();

  const remountOffice = useCallback((manual = false) => {
    if (manual) {
      setRetryCount(0);
    }
    setStatus('retrying');
    setRenderKey((current) => current + 1);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (hasOfficeCanvas()) {
      setStatus('ready');
      return;
    }

    setStatus(retryCount === 0 ? 'booting' : 'retrying');

    const intervalId = window.setInterval(() => {
      if (!hasOfficeCanvas()) {
        return;
      }

      setStatus('ready');
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    }, CANVAS_CHECK_INTERVAL_MS);

    const timeoutId = window.setTimeout(() => {
      if (hasOfficeCanvas()) {
        setStatus('ready');
        return;
      }

      if (retryCount < MAX_AUTO_RETRIES) {
        setRetryCount((current) => current + 1);
        setRenderKey((current) => current + 1);
        return;
      }

      setStatus('failed');
    }, CANVAS_BOOT_TIMEOUT_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [mounted, renderKey, retryCount]);

  if (!mounted) {
    return (
      <div
        className={`fixed top-0 bottom-0 right-0 z-0 ${isMobile ? 'left-0' : 'left-[68px]'}`}
        style={shellStyle}
      />
    );
  }

  return (
    <>
      <Office3D key={renderKey} />

      {status !== 'ready' && (
        <div className={`pointer-events-none fixed inset-y-0 right-0 z-10 flex items-center justify-center ${isMobile ? 'left-0' : 'left-[68px]'}`}>
          <div className="rounded-xl border border-white/10 bg-slate-950/70 px-5 py-4 text-center text-sm text-slate-100 shadow-2xl backdrop-blur">
            {status === 'failed' ? (
              <div className="pointer-events-auto space-y-3">
                <p>3D 办公室加载超时了，我已经自动重试过。</p>
                <button
                  type="button"
                  onClick={() => remountOffice(true)}
                  className="rounded-lg bg-amber-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-300"
                >
                  重新加载 3D 办公室
                </button>
              </div>
            ) : (
              <p>
                {retryCount === 0
                  ? '3D 办公室正在加载…'
                  : `3D 办公室加载异常，正在自动重试（${retryCount}/${MAX_AUTO_RETRIES}）…`}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
