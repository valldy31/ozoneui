// ============================================================================
// OzoneUI Micro-Signals (< 60 lines, zero dependencies)
// ============================================================================

type Subscriber = () => void;

let activeEffect: Subscriber | null = null;

export interface Signal<T> {
  (): T;
  set(next: T | ((prev: T) => T)): void;
  peek(): T;
  subscribe(fn: Subscriber): () => void;
}

export function signal<T>(initial: T): Signal<T> {
  let value = initial;
  const subs = new Set<Subscriber>();

  const read = (() => {
    if (activeEffect) subs.add(activeEffect);
    return value;
  }) as Signal<T>;

  read.peek = () => value;

  read.set = (next: T | ((prev: T) => T)) => {
    const resolved = typeof next === 'function' ? (next as (p: T) => T)(value) : next;
    if (Object.is(value, resolved)) return;
    value = resolved;
    for (const sub of Array.from(subs)) {
      sub();
    }
  };

  read.subscribe = (fn: Subscriber) => {
    subs.add(fn);
    return () => subs.delete(fn);
  };

  return read;
}

export function effect(fn: () => void): () => void {
  const runner = () => {
    const prev = activeEffect;
    activeEffect = runner;
    try {
      fn();
    } finally {
      activeEffect = prev;
    }
  };
  runner();
  return () => {
    activeEffect = null;
  };
}

export function computed<T>(fn: () => T): () => T {
  const s = signal<T>(undefined as T);
  effect(() => s.set(fn()));
  return () => s();
}
