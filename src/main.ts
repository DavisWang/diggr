import { DiggrApp } from './ui/DiggrApp';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root');
}

const app = new DiggrApp(root);
if (typeof window !== 'undefined') {
  (window as Window & { __DIGGR_APP__?: DiggrApp }).__DIGGR_APP__ = app;
}
app.mount();

if (typeof window !== 'undefined') {
  const debugMode = new URLSearchParams(window.location.search).get('debug');
  if (debugMode === 'game_over') {
    app.startNewGame();
    const state = app.getState();
    if (state) {
      state.player.health = 0;
      app.tick({ left: false, right: false, up: false, down: false, consume: [] }, 0.016);
    }
  }
}
