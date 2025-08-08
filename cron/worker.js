import index from './index.html';

export default {
  async fetch(request, env, ctx) {
    return new Response(index, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  },
};