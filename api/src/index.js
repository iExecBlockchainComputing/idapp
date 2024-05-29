import { createServer } from "node:http";
import { sconify } from "./sconify.js";

const hostname = "0.0.0.0";
const port = 3000;

const server = createServer((req, res) => {
  if (req.url === "/sconify") {
    sconify({
      dockerImageToSconify: "robiniexec/hello-world:1.0.0",
    })
      .then((sconifiedImage) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            sconifiedDockerImage: sconifiedImage,
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
