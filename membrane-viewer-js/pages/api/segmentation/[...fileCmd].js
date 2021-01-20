// We can make some getSession here api is in pages 
// import { getSession } from 'next-auth/client'
// import { securityCheck } from '../../../logic/security'

export default async function handler(req, res) {
    // Getting the dataset name
    const {
        query: { fileCmd },
    } = req;

    const FOLDER = process.env.SEGMENTATION_FOLDER;
    const email = fileCmd[0]
    const command = fileCmd[1]

    // Now translate into a realpath
    // for now it's just constant
    const basePath = `${FOLDER}${email}/`
    
    var fs = require('fs')
    try {
        if(command == "file") {
            const type = fileCmd[2]
            const filename = fileCmd[3]
            var add = "masks_2D_stitched_" 
            if(type == "3D") {
                add = "masks_3D_"
            }
            console.log(`Serving segmentation for ${filename}`)
            var buffer = fs.readFileSync(`${basePath}${add}${filename}.npy`);
            res.setHeader('Content-Type', 'image/png')
            res.status(200).send(buffer)
            console.log('Sent file.')
        } else if(command == "list") {
            console.log(`Serving list for ${email}.`)
            var dirs = fs.readdirSync(basePath);
            // That's a hack to get the list of segmented files (no metadata) 
            dirs = dirs.filter((elem) => elem.startsWith("masks_2D"))
            dirs = dirs.map((elem) => elem.substr(18,elem.length-22))
            res.status(200).json({list: dirs})
            console.log('Sent list.')
        } else {
            // Set a proper code
            console.log("Not such a command")
            res.status(404)
        }
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
