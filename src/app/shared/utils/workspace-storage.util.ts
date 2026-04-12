export function readWorkspaceState<T>(storageKey: string, fallback: T): T {
  if (typeof localStorage === 'undefined') {
    return fallback;
  }

  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function persistWorkspaceState<T>(storageKey: string, state: T): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearWorkspaceState(storageKey: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(storageKey);
}
