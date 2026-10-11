import { useEffect, useSyncExternalStore } from 'react';

// 지금 떠 있는 창(Modal) 수. 업적 알림은 창 뒤에 가려지므로 창이 모두 닫힐 때까지 기다림
let open = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// 창 컴포넌트에서 호출: 보이는 동안 '창 열림'으로 셈
export const useModalPresence = (visible: boolean) => {
  useEffect(() => {
    if (!visible) return;
    open += 1;
    notify();
    return () => {
      open -= 1;
      notify();
    };
  }, [visible]);
};

export const useAnyModalOpen = () => useSyncExternalStore(subscribe, () => open > 0);
