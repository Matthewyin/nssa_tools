import indexHtml from './index.html';
import styleCss from './style.css';
import scriptJs from './script.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(indexHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }
    if (url.pathname === '/style.css') {
      return new Response(styleCss, { headers: { 'Content-Type': 'text/css' } });
    }
    if (url.pathname === '/script.js') {
      return new Response(scriptJs, { headers: { 'Content-Type': 'application/javascript' } });
    }
    return new Response('Not Found', { status: 404 });
  },
};