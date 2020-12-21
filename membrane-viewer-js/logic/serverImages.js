
import { pad } from './auxiliary'

export function processImages(email, name) {
   /* Return a reasonable JSON
   {
      metadata: metadata
      images: listImages
   }
   */
   const FOLDER = process.env.IMAGES_FOLDER;
   var fs = require('fs');
   const metadataFile = fs.readFileSync(`${FOLDER}${email}/${name}/metadata.json`)
   const metadata = JSON.parse(metadataFile)
   const files = [...Array(parseInt(metadata.channels))].map(
      (_, idxChannels) => {
      const flags = [false]
      if (metadata.masked == "True")
         flags.push(true)
      return flags.map((flag, idxMask) => {
         var add = ""
         if (flag) {
            add = "_masked"
         }
         var arr = [...Array(parseInt(metadata.z))].map((_, idx) => ({
            original: `/api/images/${name}/${pad(idxChannels, 2)}/${pad(idx, 2)}${add}_x1.png`,
            thumbnail: `/api/images/${name}/${pad(idxChannels, 2)}/${pad(idx, 2)}${add}_100x100.png`
         }))
         return arr
      })
   })
   return ({
      metadata: metadata,
      images: files
   })
}