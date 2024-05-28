import { createServer } from 'node:http';
import { sconify } from './sconify.js';

const hostname = '127.0.0.1';
const port = 3000;

// Test
sconify({
  dockerImageToSconify: "cedric25/...@1.0.0",
})

const server = createServer((req, res) => {
  switch (req.url) {
    case "/sconify":
      sconify({
        dockerImageToSconify: "cedric25/...@1.0.0",
      }).then(() => {
        res.writeHead(200);
        res.setHeader('Content-Type', 'application/json');
        res.end({
          success: true,
          sconifiedDockerImage: "cedric25/...-debug@1.0.0",
        });
      })
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
