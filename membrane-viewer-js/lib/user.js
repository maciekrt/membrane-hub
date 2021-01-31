/** 
 * This is a seed of module handling user data.
 * It abstracts away storage and fetching of user info from session and
 * will be a natural place to introduce new abstractions like "god mode".
 */

import {
    useSession,
    getSession,
} from 'next-auth/client'

export function useUserInfo() {
    const [session, loading] = useSession()

    return session?.user
}

export async function getUserInfo(req) {
    const session = await getSession( req )
    return session?.user
}
