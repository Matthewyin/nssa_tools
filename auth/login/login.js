(() => {
  const form = document.getElementById('login-form');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const errorEl = document.getElementById('error');

  function getRedirect() {
    const url = new URL(window.location.href);
    return url.searchParams.get('redirect') || '/';
  }

  async function persistSessionToWorker(idToken) {
    await fetch('/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
  }

  function initFirebase() {
    if (!window.__FIREBASE_CONFIG__) {
      errorEl.textContent = 'Firebase 配置未加载';
      return null;
    }
    const app = firebase.initializeApp(window.__FIREBASE_CONFIG__);
    const auth = firebase.auth(app);
    // 使用本地持久化，确保登录状态在各子页面有效，避免重复登录
    auth.setPersistence('local');
    return auth;
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.__SESSION_COOKIE_NAME__ = 'nssatools_session';
    const auth = initFirebase();
    if (!auth) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      try {
        const { user } = await auth.signInWithEmailAndPassword(emailEl.value, passwordEl.value);
        const idToken = await user.getIdToken(/* forceRefresh */ true);
        await persistSessionToWorker(idToken);
        const redirect = getRedirect();
        window.location.replace(redirect);
      } catch (err) {
        errorEl.textContent = err.message || '登录失败，请重试';
      }
    });
  });
})();
