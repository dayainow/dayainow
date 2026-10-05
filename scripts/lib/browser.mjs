import { existsSync } from 'node:fs';

// 렌더링·스크린샷에 쓸 로컬 Edge/Chrome 경로 (BROWSER_PATH 환경변수로 직접 지정 가능)
export const findBrowser = () => {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find(p => existsSync(p));
  if (!found) throw new Error('Edge/Chrome을 찾지 못했습니다. BROWSER_PATH 환경변수로 경로를 지정하세요.');
  return found;
};
