'use client';

import {
  toast as baseToast,
  type Toast,
  type ToastOptions,
  type ValueOrFunction,
  type Renderable
} from 'react-hot-toast';

const DEDUP_WINDOW_MS = 3000;
const MAX_TRACKED_KEYS = 400;

const recentToastMap = new Map<string, number>();

const cleanupOldestKey = () => {
  if (recentToastMap.size <= MAX_TRACKED_KEYS) return;
  const oldestEntry = recentToastMap.entries().next().value as
    | [string, number]
    | undefined;
  if (oldestEntry) {
    recentToastMap.delete(oldestEntry[0]);
  }
};

const normalizeMessageKey = (
  message: ValueOrFunction<Renderable, Toast>,
  options?: ToastOptions
): string | undefined => {
  if (options?.id) {
    return options.id;
  }

  if (typeof message === 'string' || typeof message === 'number') {
    return String(message).trim();
  }

  if (typeof message === 'function') {
    try {
      return message.toString();
    } catch {
      return undefined;
    }
  }

  if (typeof message === 'object' && message !== null) {
    const reactLike = message as unknown as { props?: unknown };
    if (reactLike.props) {
      try {
        return JSON.stringify(reactLike.props);
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
};

const shouldDisplayToast = (key?: string): { allowed: boolean; key?: string } => {
  if (!key) {
    return { allowed: true };
  }

  const now = Date.now();
  const lastShownAt = recentToastMap.get(key);

  if (lastShownAt && now - lastShownAt < DEDUP_WINDOW_MS) {
    return { allowed: false, key };
  }

  recentToastMap.set(key, now);
  cleanupOldestKey();

  setTimeout(() => {
    const stored = recentToastMap.get(key);
    if (stored && stored === now) {
      recentToastMap.delete(key);
    }
  }, DEDUP_WINDOW_MS * 2);

  return { allowed: true, key };
};

const withDedup =
  <T extends (message: ValueOrFunction<Renderable, Toast>, options?: ToastOptions) => ReturnType<typeof baseToast>>(
    method: T
  ) =>
  (message: Parameters<T>[0], options?: ToastOptions) => {
    const key = normalizeMessageKey(message, options);
    const { allowed, key: normalizedKey } = shouldDisplayToast(key);

    if (!allowed) {
      return normalizedKey ?? '';
    }

    const finalOptions =
      options || normalizedKey
        ? {
            ...options,
            id: options?.id ?? normalizedKey
          }
        : options;

    return method(message, finalOptions);
  };

const toast = withDedup(baseToast) as typeof baseToast;
toast.success = withDedup(baseToast.success);
toast.error = withDedup(baseToast.error);
toast.loading = withDedup(baseToast.loading);
toast.custom = withDedup(baseToast.custom);

toast.promise = baseToast.promise.bind(baseToast);
toast.dismiss = baseToast.dismiss.bind(baseToast);
toast.remove = baseToast.remove.bind(baseToast);

export { toast };
export default toast;
