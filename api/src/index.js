import 'dotenv/config';
import express from 'express';
import { sconify } from './sconify.js';

const app = express();
const hostname = '0.0.0.0';
const port = 3000;

app.use(express.json());

app.post('/sconify', async (req, res) => {
  const { yourWalletPublicAddress, dockerhubImageToSconify } = req.body;
  try {
    const { appContractAddress, transferAppTxHash } = await sconify({
      dockerImageToSconify: dockerhubImageToSconify,
      userWalletPublicAddress: yourWalletPublicAddress,
    });

    res.status(200).json({
      success: true,
      appContractAddress,
      transferAppTxHash,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.status(200).send('Hello from idapp-sconifier-api 👋');
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
