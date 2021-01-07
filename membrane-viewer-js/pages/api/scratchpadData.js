// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'
import { processScratchpad } from '../../logic/processScratchpad'

export default async function handler(req, res) {
    const session = await getSession({ req })
    if (session) {
        const email = session.user.email
        console.log(`api/scratchpadData: Session exists for ${email}. Processing..`)
        try {
            const scratchpadData = processScratchpad(email)
            res.status(200).json(scratchpadData)
            // console.log(`api/scratchpadData: Successful. ${JSON.stringify(scratchpadData)}`)
        } catch (err) {
            console.log(`api/scratchpadData: Processing error (${err}).`)
            res.status(401).json({ error: "api/scratchpadData: processing error" })
        }
    } else {
        console.log("api/scratchpadData: Session error.")
        res.status(403).json({ error: "api/scratchpadData: session error" })
    }
}