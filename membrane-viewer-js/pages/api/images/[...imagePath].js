// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'

const securityList = ['m.zdanowicz@gmail.com']

export default async function handler(req, res) {
    const session = await getSession({ req })  
    const {
        query: { imagePath },
    } = req
    var name = imagePath.join('/')

    console.log(`user: ${imagePath} ${name}`)
    // || securityList.indexOf(session.user.email) == -1
    var fs = require('fs')
    var buffer = fs.readFileSync('/Users/maciek/JS/data-membrane-viewer/public/images/'+name);
    console.log(`len: ${buffer && buffer.length}`)
    res.status(200).send(buffer)
    res.end(null)
}