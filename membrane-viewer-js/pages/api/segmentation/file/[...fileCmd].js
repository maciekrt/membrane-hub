// We can make some getSession here api is in pages 
// import { getSession } from 'next-auth/client'
// import { securityCheck } from '../../../lib/security'

export default async function handler(req, res) {
    // Getting the dataset name
    const {
        query: { fileCmd },
    } = req;

    const FOLDER = process.env.SEGMENTATION_FOLDER;
    const email = fileCmd[0]
    const filename = fileCmd[1]

    // Now translate into a realpath
    // for now it's just constant
    const basePath = `${FOLDER}${email}/`
    
    var fs = require('fs')
    try {
        var add = "masks_3D_conv_clipped_"
        console.log(`Serving segmentation for ${filename}`)
        var buffer = fs.readFileSync(`${basePath}${add}${filename}.npy`);
        res.setHeader('Content-Type', 'image/png')
        res.status(200).send(buffer)
        console.log('Sent file.')
        // securityCheck(imagePath[0], session.user.email)
        // if (domainMe != domainLink || securityWhitelist.indexOf(session.user.email) == -1) {
        //     throw new Error("wrong domains")
        // } else {
        //     console.log("Image: same domains - OK.")
        // }
    } catch (err) {
        console.log(`Such segmentation is not available: ${err.message}`)
        res.status(404)
    }
    res.end(null)
}
