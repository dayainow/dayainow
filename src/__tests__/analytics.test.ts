import { setAnalyticsSink, track } from '../analytics';

afterEach(() => setAnalyticsSink(null));

describe('analytics', () => {
  it('sends nothing until a sink is connected', () => {
    expect(() => track('app_open', { first_open: true })).not.toThrow();
  });

  it('forwards events with their properties to the connected sink', () => {
    const events: [string, unknown][] = [];
    setAnalyticsSink((name, props) => events.push([name, props]));
    track('stage_end', { stage: 3, result: 'win', moves: 9, stars: 3, undos: 0 });
    expect(events).toEqual([['stage_end', { stage: 3, result: 'win', moves: 9, stars: 3, undos: 0 }]]);
  });

  it('never lets a broken sink crash the game', () => {
    setAnalyticsSink(() => {
      throw new Error('network down');
    });
    expect(() => track('undo', { screen: 'play' })).not.toThrow();
  });
});
