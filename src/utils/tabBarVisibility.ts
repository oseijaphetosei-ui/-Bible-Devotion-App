type Listener = (hidden: boolean) => void;

let _hidden = false;
const _listeners = new Set<Listener>();

export function setTabBarHidden(hidden: boolean) {
  if (_hidden === hidden) return;
  _hidden = hidden;
  _listeners.forEach(l => l(hidden));
}

export function getTabBarHidden(): boolean {
  return _hidden;
}

export function subscribeTabBarVisibility(listener: Listener): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}
