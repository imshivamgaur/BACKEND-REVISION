const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 4000;

const server = http.createServer((req, res) => {
  let filePath = path.join(
    __dirname,
    req.url === "/" ? "index.html" : req.url.concat(".html")
  );
  console.log(filePath);
  let extensionName = String(path.extname(filePath)).toLowerCase();

  // allowing which type of file the server is supporting
  const mimiType = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "text/png",
  };

  let contentType = mimiType[extensionName] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "content-type": "text/html" });
        res.end("<h1>404: File not find broooo..</h1>");
      }
    } else {
      res.writeHead(200, { "content-type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(port, () => {
  console.log(`Server is listing on port ${port}`);
});
