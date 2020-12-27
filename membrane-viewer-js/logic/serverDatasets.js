
export function processDatasets(email) {
   /* Returns a JSON:
   {  
      error: ...
      datasets: {
      [{ filename: "...", metadata: { ... } }, ...] }
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
   console.log(`serverDatasets: Directories read ${dirs}.`)
   try {
      const resList = dirs.map((dir) => {
         console.log(`serverDatasets: ${dir}`)
         const fs2 = require('fs');
         const metadataFile = fs2.readFileSync(`${FOLDER}${email}/${dir}/metadata.json`)
         const metadata = JSON.parse(metadataFile)
         console.log(`serverDatasets: Metadata ${metadataFile}.`)
         return ({
            imagename: dir,
            metadata: metadata
         })
      })
      console.log(`serverDatasets[resList]: ${JSON.stringify(resList)}`)
      const result = {
         error: "OK",
         datasets: resList
      }
      console.log("serverDatasets: Ok")
      return result
   } catch (err) {
      console.log(`serverDatasets: ${error}`)
   }
   return {
      error: "Error",
      datasets: null
   }
}
