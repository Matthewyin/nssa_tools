(() => {
  const form = document.getElementById('login-form');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const errorEl = document.getElementById('error');

  let auth = null;

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

  function waitForFirebase(maxWaitMs = 5000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      (function poll(){
        if (window.__FIREBASE_CONFIG__ && window.firebase && firebase.auth){
          resolve(true);
        } else if (Date.now() - start > maxWaitMs) {
          reject(new Error('Firebase 未就绪'));
        } else {
          setTimeout(poll, 50);
        }
      })();
    });
  }

  async function ensureAuth(){
    if (auth) return auth;
    await waitForFirebase();
    if (!firebase.apps || firebase.apps.length === 0){
      firebase.initializeApp(window.__FIREBASE_CONFIG__);
    }
    auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    return auth;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    window.__SESSION_COOKIE_NAME__ = 'nssatools_session';
    try{ await ensureAuth(); }catch(e){ errorEl.textContent = '初始化失败，请刷新后重试'; }

    // 若用户已通过 Firebase 持久化处于登录状态，则自动同步会话到 Worker 并跳转
    firebase.auth().onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const idToken = await user.getIdToken(/* forceRefresh */ true);
          await persistSessionToWorker(idToken);
          const target = getRedirect() || '/';
          window.location.replace('/?redirect=' + encodeURIComponent(target));
        }
      } catch (err) {
        // 忽略自动同步失败，用户可手动登录
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      try {
        const a = await ensureAuth();
        const { user } = await a.signInWithEmailAndPassword(emailEl.value, passwordEl.value);
        const idToken = await user.getIdToken(/* forceRefresh */ true);
        await persistSessionToWorker(idToken);
        const target = getRedirect() || '/';
        window.location.replace('/?redirect=' + encodeURIComponent(target));
      } catch (err) {
        errorEl.textContent = err.message || '登录失败，请重试';
      }
    });
  });
})();
