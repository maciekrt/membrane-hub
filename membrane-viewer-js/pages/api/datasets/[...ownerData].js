// We can make some getSession here api is in pages 
import { getUserInfo } from '../../../lib/user'
import { processDatasets } from '../../../lib/serverDatasets'
import { getSameDomainEmails } from '../../../lib/security'

export default async function handler(req, res) {
    const user = await getUserInfo( req )
    const {
        query: { ownerData },
    } = req;

    // This endpoint serves your own data or data of your peers (same domain)
    // depending on whether the command == "mine" or command == "theirs"
    const command = ownerData[0]

    if (user) {
        console.log(`api/datasets: User exists.`)
        try {
            const email = user.email
            console.log(`api/datasets: Request for ${email}.`)
            console.log("api/datasets: Processing datasets.")
            if(command == "mine") {
                const resultMine = processDatasets(email)
                res.status(200).json(resultMine)
            } else if(command == "theirs") {
                console.log(`Processing theirs for ${email}`)
                const emails = getSameDomainEmails(email)
                console.log(`Emails: ${emails}`)
                const resultTheirs = emails.map((val,_) => {
                    const dataset = processDatasets(val).datasets
                    return { email: val, datasets : dataset }
                })
                res.status(200).json({datasets: resultTheirs})
            } else 
                throw "Not a command"
            
        } catch (err) {
            console.log(`api/datasets: Processing error (${err}).`)
            res.status(401).json({ error: "api/datasets: processing error" })
        }
    } else {
        console.log("api/datasets: User error.")
        res.status(403).json({ error: "api/datasets: User error" })
    }
}
