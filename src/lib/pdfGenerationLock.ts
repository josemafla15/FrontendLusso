type Listener = (locked: boolean) => void;

let locked = false;
const listeners = new Set<Listener>();

export function setPdfGenerationLock(value: boolean) {
  locked = value;
  listeners.forEach((l) => l(locked));
}

export function subscribePdfGenerationLock(listener: Listener): () => void {
  listeners.add(listener);
  listener(locked);
  return () => listeners.delete(listener);
}