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
    await pullImage(SCONE_IMAGE); // I think it's optional because it should be only one time
    await sconifyImage({
      fromImage: dockerImageToSconify,
      toImage: targetImage,
    });
    await pushImage(targetImage);
    console.log("All operations completed successfully.");
    return targetImage;
  } catch (error) {
    console.error("An error occurred during the process:", error);
    throw error;
  }
}
