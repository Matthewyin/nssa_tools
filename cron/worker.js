import indexHtml from './index.html';
import styleCss from './css/style.css';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(indexHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }
    if (url.pathname === '/css/style.css') {
      return new Response(styleCss, { headers: { 'Content-Type': 'text/css' } });
    }
    return new Response('Not Found', { status: 404 });
  },
};