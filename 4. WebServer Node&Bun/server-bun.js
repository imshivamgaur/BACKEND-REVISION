const { serve } = require("bun");

serve({
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response("Hello this is from bun", { status: 200 });
    } else if (url.pathname === "/bun") {
      return new Response("Yo! bun is here", { status: 200 });
    } else {
      return new Response("404 Not Fount", { status: 404 });
    }
  },
  port: 4000,
  hostname: "127.0.0.1",
});
