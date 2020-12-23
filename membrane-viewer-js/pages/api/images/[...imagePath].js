// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'

const securityWhitelist = ['m.zdanowicz@gmail.com', 'grzegorz.kossakowski@gmail.com', 
    'a.magalska@nencki.edu.pl']

export default async function handler(req, res) {
    const session = await getSession({ req }) 
    if(session) {
        // console.log('Security whitelist contains your email.')
        const {
            query: { imagePath },
        } = req;
        const FOLDER = process.env.IMAGES_FOLDER;
        var name = imagePath.join('/');
        const domainMe = session.user.email.split("@")[1]
        const domainLink = imagePath[0].split("@")[1]

        var fs = require('fs')
        try {
            if (domainMe != domainLink) {
                throw new Error("wrong domains")
            } else {
                console.log("Image: same domains - OK.")
            }
            var buffer = fs.readFileSync(`${FOLDER}${name}`);
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
