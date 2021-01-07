
import { pad } from './auxiliary'

export function processImages(email, name) {
   /* Return a reasonable JSON
   { metadata: { ... }, images: [ ... ] }
   */
   const FOLDER = process.env.IMAGES_FOLDER;
   var fs = require('fs');
   const pathDataset = `${email}/${name}`
   const metadataFile = fs.readFileSync(`${FOLDER}${pathDataset}/metadata.json`)
   const metadata = JSON.parse(metadataFile)
   const files = [...Array(parseInt(metadata.channels))].map(
      (_, idxChannels) => {
      const flags = [false]
      if (metadata.masked == true)
         flags.push(true)
      return flags.map((flag, _) => {
         var add = flag ? "_masked" : ""
         var arr = []
         if(metadata.dims === "2D") {
            console.log(`logic/processImages[metadata.images]: ${metadata.images} `)
            arr = metadata.images.map((filename, _) => ({
               original: `/api/images/${pathDataset}/${idxChannels}/${filename}`,
               thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}`
            }))
         } else {
            arr = metadata.images.map((filename, _) => ({
               original: `/api/images/${pathDataset}/${idxChannels}/${filename}${add}_x1.png`,
               thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}${add}_100x100.png`
            }))
         }
         return arr
      })
   })
   return ({
      metadata: metadata,
      images: files
   })
}