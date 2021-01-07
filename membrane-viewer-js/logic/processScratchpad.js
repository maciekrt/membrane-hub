
export function processScratchpad(email) {
   const FOLDER = process.env.IMAGES_FOLDER;
   const baseDir = `${FOLDER}${email}/scratchpad`;

   console.log(`processScratchpad: Processing ${email} scratchpad.`);
   try {
      const fs = require('fs');
      const metadataFile = fs.readFileSync(`${baseDir}/metadata.json`);
      const metadata = JSON.parse(metadataFile);
      // console.log(`processScratchpad: Metadata ${JSON.stringify(metadata)}.`);
      return ({
         imagename: "scratchpad",
         metadata: metadata
      });
   } catch (err) {
      console.log(`processScratchpad: ${err}`);
      return ({
         error: "Error",
         datasets: null
      });
   }
}
