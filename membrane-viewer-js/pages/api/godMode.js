import Cookies from 'cookies'

import {
    useSession,
    getSession,
} from 'next-auth/client'

export default async (req, res) => {
    // TODO(gkk): figure out why getSession requires wrapping req in {}
    const session = await getSession({ req })
    const originalUser = session?.user
    const isAdmin = ['grzegorz.kossakowski@gmail.com', 'm.zdanowicz@gmail.com'].includes(originalUser?.email)
    if (!isAdmin) {
        const errorMsg = originalUser ? originalUser.email : "not logged in"
        res.status(401).send(`You're not authorized to call this API end-point: ${errorMsg}`)
        return
    }
    // Create a cookies instance
    const cookies = new Cookies(req, res)
    // Get a cookie
    console.log(req.query.as_user)
    const as_user = req.query.as_user
    if (as_user == 'off') {
        console.log('Turning off the god mode')
        cookies.set('godMode')
    } else if (as_user == undefined) {
        res.status(400).send('Provide `as_user` parameter')
        return
    } else {
        console.log(`Setting god mode as ${as_user}`)
        // Set a cookie
        cookies.set('godMode', as_user, {
            httpOnly: true // true by default
        })
    }
    res.status(200).json({godMode: as_user})
  }
