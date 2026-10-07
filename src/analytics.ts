// 분석 이벤트. 어떤 서비스(PostHog 등)로 보낼지는 setAnalyticsSink로 연결하고, 연결 전에는 어디에도 보내지 않음
// 이벤트 이름과 속성을 타입으로 고정해서 오타나 빠진 값이 없게 함

export type AnalyticsEvents = {
  app_open: { first_open: boolean };
  onboarding_choice: { choice: 'new' | 'knows' | 'later' };
  lesson_complete: { lesson: string };
  tutorial_complete: Record<string, never>;
  daily_open: { number: number; solved: boolean };
  daily_hint: { number: number };
  daily_wrong: { number: number; attempt: number };
  daily_solved: { number: number; attempts: number; hints: number };
  share: { source: 'daily'; format: 'image' | 'text' };
  reminder_prompt: { action: 'shown' | 'enabled' | 'denied' | 'dismissed' };
  stage_start: { stage: number };
  stage_end: { stage: number; result: 'win' | 'lose' | 'draw'; moves: number; stars: number; undos: number };
  free_play_end: { mode: 'pve' | 'pvp'; difficulty: string; result: 'win' | 'lose' | 'draw' };
  undo: { screen: 'play' | 'stage' };
  setting_change: { key: string; value: boolean | string };
  rules_open: { source: 'home' | 'header' | 'learn' };
};

export type AnalyticsSink = (event: string, props: Record<string, unknown>) => void;

let sink: AnalyticsSink | null = null;

export const setAnalyticsSink = (next: AnalyticsSink | null) => {
  sink = next;
};

export const track = <K extends keyof AnalyticsEvents>(event: K, props: AnalyticsEvents[K]) => {
  try {
    sink?.(event, props);
  } catch {
    // 분석 실패는 게임에 영향 없음
  }
};
