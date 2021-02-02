// We can make some getSession here api is in pages 
// import { getSession } from 'next-auth/client'
// import { securityCheck } from '../../../lib/security'

export default async function handler(req, res) {
    // Getting the dataset name
    const {
        query: { listCmd },
    } = req;

    const FOLDER = process.env.SEGMENTATION_FOLDER;
    const email = listCmd[0]

    // Now translate into a realpath
    // for now it's just constant
    const basePath = `${FOLDER}${email}/`
    
    var fs = require('fs')
    try {
        console.log(`Serving list for ${email}.`)
        const dirs = fs.readdirSync(basePath);
        // That's a hack to get the list of segmented files (no metadata) 
        const dirs_CC = dirs.filter((elem) => elem.startsWith("masks_3D_conv_clipped_"))
        // dirs = dirs.filter((elem) => elem.startsWith("masks_3D_"))
        // const dirs_ordinary = dirs.filter((elem) => !dirs_CC.includes(elem))
        const dirs_result = dirs_CC.map((elem) => elem.substr(22,elem.length-26))
        res.status(200).json({list: dirs_result})
        console.log('Sent list.')
        // securityCheck(imagePath[0], session.user.email)
        // if (domainMe != domainLink || securityWhitelist.indexOf(session.user.email) == -1) {
        //     throw new Error("wrong domains")
        // } else {
        //     console.log("Image: same domains - OK.")
        // }
    } catch (err) {
        console.log(`Segmentations for such user are not available: ${err.message}`)
        res.status(404)
    }
    res.end(null)
}
