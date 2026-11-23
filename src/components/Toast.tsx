import { useEffect } from "react";

export interface Status {
  id: number;
  message: string;
  isError: boolean;
}

/**
 * Bottom-centre toast. Success messages fade after a few seconds; errors stay until dismissed or replaced.
 * `onDismiss` must be stable (useCallback) so the timer isn't restarted on every render.
 */
export function Toast({ status, onDismiss }: { status: Status; onDismiss: () => void }) {
  useEffect(() => {
    if (!status.message || status.isError) return;
    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [status, onDismiss]);

  const visible = status.message !== "";
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {visible && (
        <div key={status.id} id="status" className={status.isError ? "toast error" : "toast"}>
          <span className="toast-icon" aria-hidden="true">
            {status.isError ? "!" : "✓"}
          </span>
          <span className="toast-text">{status.message}</span>
          {status.isError && (
            <button type="button" className="toast-close" aria-label="Dismiss" onClick={onDismiss}>
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
