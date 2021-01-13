// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'
import { securityCheck } from '../../../logic/security'

export default async function handler(req, res) {
    const session = await getSession({ req }) 
    if(session) {
        // console.log('Security whitelist contains your email.')
        const {
            query: { imagePath },
        } = req;
        const FOLDER = process.env.IMAGES_FOLDER;
        var pathImageLocal = imagePath.join('/');
        const domainMe = session.user.email.split("@")[1]
        const domainLink = imagePath[0].split("@")[1]

        var fs = require('fs')
        try {
            securityCheck(imagePath[0], session.user.email)
            // if (domainMe != domainLink || securityWhitelist.indexOf(session.user.email) == -1) {
            //     throw new Error("wrong domains")
            // } else {
            //     console.log("Image: same domains - OK.")
            // }
            var buffer = fs.readFileSync(`${FOLDER}${pathImageLocal}`);
            res.setHeader('Cache-Control', 'public, must-revalidate, max-age=3155760');
            res.setHeader('Content-Type', 'image/png')
            res.status(200).send(buffer)
        } catch (err) {
            console.log(`Not such a LOADING IMAGE ${err.message}`)
            res.status(404)
        }
        res.end(null)
    } else {
        // console.log("You might be not on a security whitelist.")
        res.status(401).end(null)
    }
}
