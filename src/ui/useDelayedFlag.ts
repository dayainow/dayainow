import { useEffect, useState } from 'react';

// flag가 켜진 뒤 ms만큼 지나서야 true. 꺼지면 바로 false
// (체크메이트 도장과 판의 마지막 모습을 잠깐 보여 준 뒤 결과 창을 띄울 때)
export const useDelayedFlag = (flag: boolean, ms: number): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!flag) {
      setReady(false);
      return;
    }
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, [flag, ms]);

  return ready;
};
