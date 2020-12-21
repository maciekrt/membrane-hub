
export function processDatasets(email) {
   /* Returns a JSON:
   datasets: {
      [{
            filename
            metadata
      },
      ...
      ]
   }*/
   const FOLDER = process.env.IMAGES_FOLDER
   const baseDir = `${FOLDER}${email}/`
   const fs = require('fs');

   var dirs = fs.readdirSync(baseDir);
   dirs.sort(function (a, b) {
      return fs.statSync(baseDir + b).mtime.getTime() -
         fs.statSync(baseDir + a).mtime.getTime();
   });
   // Some error handling should be added here.
   console.log(`serverDatasets: Directories read.`)
   const resList = dirs.map((dir) => {
      const metadataFile = fs.readFileSync(`${FOLDER}${email}/${dir}/metadata.json`)
      const metadata = JSON.parse(metadataFile)
      return ({
         imagename: dir,
         metadata: metadata
      })
   })
   console.log(`serverDatasets[resList]: ${JSON.stringify(resList)}`)
   const result = {
      datasets: resList
   }
   console.log("serverDatasets: Ok")
   return result
}
