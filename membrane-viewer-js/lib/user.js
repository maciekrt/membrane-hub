/** 
 * This is a seed of module handling user data.
 * It abstracts away storage and fetching of user info from session and
 * will be a natural place to introduce new abstractions like "god mode".
 */

import {
    useSession,
    getSession,
} from 'next-auth/client'

import Cookies from 'cookies'

function alterUserWithGodMode(user, godMode) {
    if (godMode == undefined)
        // no alter source
        return user
    else {
        // no alter target
        if (user == undefined) {
            return user
        } else {
            return {
                email: godMode,
                originalEmail: user.email,
            }
        }
    }
}

export function useUserInfo(godMode) {
    const [session, loading] = useSession()
    const originalUser = session?.user
    console.log(originalUser)
    return alterUserWithGodMode(originalUser, godMode)
}

export async function getUserInfo(req) {
    // TODO(gkk): figure out why getSession requires wrapping req in {}
    const session = await getSession({ req })
    const originalUser = session?.user
    const godMode = getGodMode(req)
    return alterUserWithGodMode(originalUser, godMode)
}

export function getGodMode(req) {
    const cookies = new Cookies(req)
    const godMode = cookies.get('godMode')
    console.log(`user.js godMode: ${godMode}`)
    return godMode
}
