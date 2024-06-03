import "dotenv/config";
import { pullImage } from "./singleFunction/pullImage.js";
import { sconifyImage } from "./singleFunction/sconifyImage.js";
import { pushImage } from "./singleFunction/pushImage.js";

export async function sconify({ dockerImageToSconify }) {
  const SCONE_IMAGE =
    "registry.scontain.com/sconecuratedimages/node:14.4.0-alpine3.11";
  const targetImage = `teamproduct/hello-world:1.0.0-debug-tee-scone`;
  console.log(targetImage);
  try {
    try {
      // Pull the SCONE image only if necessary
      await pullImage(SCONE_IMAGE);
      
      // Sconify Image
      await sconifyImage({
        fromImage: dockerImageToSconify,
        toImage: targetImage,
      });
  
      // Tag the image before pushing
      await new Promise((resolve, reject) => {
        docker
          .getImage(targetImage)
          .tag({ repo: targetImage }, (err, data) => {
            if (err) {
              console.error("Error tagging the image:", err);
              return reject(err);
            }
            console.log(`Image tagged as ${targetImage}`);
            resolve(data);
          });
      });
    await pushImage(targetImage);
    console.log("All operations completed successfully.");
    return targetImage;
  } catch (error) {
    console.error("An error occurred during the process:", error);
    throw error;
  }
}
