
import { pad } from './auxiliary'

export function processImages(email, name) {
   /* Return a reasonable JSON
   { metadata: { ... }, images: [ ... ] }
   */
   const FOLDER = process.env.IMAGES_FOLDER;
   var fs = require('fs');
   const pathDataset = `${email}/${name}`
   const metadataFile = fs.readFileSync(`${FOLDER}${pathDataset}/metadata.json`)
   // This a metadata file for the dataset
   const metadata = JSON.parse(metadataFile)
   const files = [...Array(parseInt(metadata.channels))].map(
      (_, idxChannels) => {
      var res = {unmasked: [], mask2D: [], mask3D: []}
      res.unmasked = metadata.images.map((filename, _) => ({
         original: `/api/images/${pathDataset}/${idxChannels}/${filename}_x1.png`,
         thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}_100x100.png`
      }))
      if (metadata.masked == true) {
         res.mask2D = metadata.images.map((filename, _) => ({
            original: `/api/images/${pathDataset}/${idxChannels}/${filename}_masked_x1.png`,
            thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}_masked_100x100.png`
         }))
      }
      if (metadata.masked3d == true) {
         res.mask3D = metadata.images.map((filename, _) => ({
            original: `/api/images/${pathDataset}/${idxChannels}/${filename}_masked3d_x1.png`,
            thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}_masked3d_100x100.png`
         }))
      }
      if (!!metadata.mask_3D_conv_clipped == true) {
         res.mask3D_CC = metadata.images.map((filename, _) => ({
            original: `/api/images/${pathDataset}/${idxChannels}/${filename}_masked3d_conv_clipped_x1.png`,
            thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}_masked3d_conv_clipped_100x100.png`
         }))
      }
      if (!!metadata.outlines == true) {
         res.outlines3D = metadata.images.map((filename, _) => ({
            original: `/api/images/${pathDataset}/${idxChannels}/${filename}_outlines_x1.png`,
            thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}_outlines_100x100.png`
         }))
      }
      if (!!metadata.outlines_conv_clipped == true) {
         res.outlines3D_CC = metadata.images.map((filename, _) => ({
            original: `/api/images/${pathDataset}/${idxChannels}/${filename}_outlines_conv_clipped_x1.png`,
            thumbnail: `/api/images/${pathDataset}/${idxChannels}/${filename}_outlines_conv_clipped_100x100.png`
         }))
      }
      // console.log(`process_images[res]: ${JSON.stringify(res)}`)
      return res
   })
   return ({
      metadata: metadata,
      images: files
   })
}