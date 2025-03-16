const http = require("http");

const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hey shivamIsHere!");
  } else if (req.url === "/shivam") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Are ess route pe q aarha hai bhai?");
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("404 Not Found!");
  }
});

server.listen(port, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
