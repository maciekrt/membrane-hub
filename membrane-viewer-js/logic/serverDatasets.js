
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
   // Removing scratchpad from the list of datasets 
   dirs = dirs.filter((elem) => (elem != "scratchpad"))
   dirs.sort(function (a, b) {
      return fs.statSync(baseDir + b).mtime.getTime() -
         fs.statSync(baseDir + a).mtime.getTime();
   });
   // Some error handling should be added here.
   // console.log(`logic/processDatasets: Directories read ${dirs}.`)
   try {
      const resList = dirs.map((dir) => {
         // console.log(`logic/processDatasets: ${dir}`)
         const fs2 = require('fs');
         const metadataFile = fs2.readFileSync(`${FOLDER}${email}/${dir}/metadata.json`)
         const metadata = JSON.parse(metadataFile)
         // console.log(`logic/processDatasets: Metadata ${metadataFile}.`)
         return ({
            imagename: dir,
            metadata: metadata
         })
      })
      // console.log(`logic/processDatasets[resList]: ${JSON.stringify(resList)}`)
      const result = {
         error: "OK",
         datasets: resList
      }
      console.log("logic/processDatasets: Ok")
      return result
   } catch (err) {
      console.log(`logic/processDatasets: ${error}`)
   }
   return {
      error: "Error",
      datasets: null
   }
}