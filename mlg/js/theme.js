(function(){
  const THEME_KEY = 'mlg_theme';
  function applyThemeClass(theme){
    const body = document.body;
    body.classList.remove('dark-theme','system-theme');
    if (theme === 'dark') body.classList.add('dark-theme');
    else if (theme === 'system') body.classList.add('system-theme');
  }
  function setTheme(theme){
    try{ localStorage.setItem(THEME_KEY, theme); }catch{}
    applyThemeClass(theme);
    highlightActive(theme);
    notifyChange(theme);
  }
  function getTheme(){
    try{ return localStorage.getItem(THEME_KEY) || 'light'; }catch{ return 'light'; }
  }
  function highlightActive(active){
    const ids = ['theme-light-btn','theme-dark-btn','theme-system-btn'];
    ids.forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('theme-btn-active', id===`theme-${active}-btn`);
    });
  }
  function notifyChange(theme){
    try{
      const ev = new CustomEvent('mlg:theme-change', { detail: { theme } });
      window.dispatchEvent(ev);
    }catch{}
  }
  function init(){
    const t = getTheme();
    applyThemeClass(t);
    highlightActive(t);
    // 首次也广播一次，确保依赖者（如画布）能同步重绘
    notifyChange(t);

    // 系统主题变化时同步，仅在 system 模式下
    try{
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener?.('change', ()=>{
        const curr = getTheme();
        if (curr === 'system'){
          applyThemeClass('system');
          notifyChange('system');
        }
      });
    }catch{}

    // 跨标签同步
    window.addEventListener('storage', (e)=>{
      if (e.key !== THEME_KEY) return;
      const v = getTheme();
      applyThemeClass(v);
      highlightActive(v);
      notifyChange(v);
    });

    // 绑定按钮
    ['light','dark','system'].forEach(mode=>{
      const btn = document.getElementById(`theme-${mode}-btn`);
      if (btn) btn.addEventListener('click', ()=> setTheme(mode));
    });
  }
  window.MLG_THEME = { setTheme };
  // 提前应用已保存主题，避免首帧闪白/闪黑
  try{ applyThemeClass(getTheme()); }catch{}
  document.addEventListener('DOMContentLoaded', init);
})();
