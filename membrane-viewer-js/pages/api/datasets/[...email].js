// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'
import { processDatasets } from '../../../logic/serverDatasets'

export default async function handler(req, res) {
    const session = await getSession({ req })
    const {
        query: { email },
    } = req;
    console.log(`api/datasets: Request for ${email}.`)

    if (session) {
        console.log(`api/datasets: Session exists.`)
        try {
            console.log(`api/datasets: Processing datasets.`)
            const result = processDatasets(email)
            res.status(200).json(result)
        } catch (err) {
            console.log(`api/datasets: Processing error (${err}).`)
            res.status(401).json({ error: "api/datasets: processing error" })
        }
    } else {
        console.log("api/datasets: Session error.")
        res.status(403).json({ error: "api/datasets: session error" })
    }
}
