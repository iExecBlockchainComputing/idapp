import { createServer } from "node:http";
import { sconify } from "./sconify.js";

const hostname = "0.0.0.0";
const port = 3000;

const server = createServer((req, res) => {
  if (req.url === "/sconify") {
    sconify({
      dockerImageToSconify: "cedric25/...@1.0.0",
    })
      .then(() => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            sconifiedDockerImage: "cedric25/...-debug@1.0.0",
          })
        );
      })
      .catch((err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
  } else {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello from idapp-sconifier-api 👋");
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
