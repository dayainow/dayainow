import React, { createContext, useCallback, useContext, useState } from 'react';
import { track } from '../analytics';
import { RulesSheet } from '../components/RulesSheet';

export type RulesSource = 'home' | 'header' | 'learn';

const OpenRulesContext = createContext<(source: RulesSource) => void>(() => {});

// 규칙 안내 시트를 앱에 하나만 두고, 어느 화면에서든 열 수 있게 함
export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const open = useCallback((source: RulesSource) => {
    track('rules_open', { source });
    setVisible(true);
  }, []);

  return (
    <OpenRulesContext.Provider value={open}>
      {children}
      <RulesSheet visible={visible} onClose={() => setVisible(false)} />
    </OpenRulesContext.Provider>
  );
}

export const useOpenRules = () => useContext(OpenRulesContext);
