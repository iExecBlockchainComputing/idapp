import 'dotenv/config';
import { createServer } from 'node:http';
import { sconify } from './sconify.js';

const hostname = '0.0.0.0';
const port = 3000;

const server = createServer(async (req, res) => {
  if (req.url === '/sconify') {
    const json = await new Promise((resolve, reject) => {
      req.on('data', (data) => {
        const dataStr = String(data, 'utf-8');
        resolve(JSON.parse(dataStr));
      });
    });
    console.log('json', json);
    const dockerhubImageToSconify = json.dockerhubImageToSconify;

    sconify({
      dockerImageToSconify: dockerhubImageToSconify,
      userWalletPublicAddress: json.yourWalletPublicAddress,
    })
      .then(({ sconifiedImage, appContractAddress, transferAppTxHash }) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            sconifiedImage,
            appContractAddress,
            transferAppTxHash,
          })
        );
      })
      .catch((err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello from idapp-sconifier-api 👋');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
