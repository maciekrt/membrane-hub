import React from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/client'
import useSWR from 'swr'

import Layout, { siteTitle } from '../components/layout'
import Scratchpad from '../components/scratchpad'


function useScratchpadSWR(session) {
    const fetcher = (url) => fetch(url)
        .then(res => res.json())
        .then(data => { console.log(`fetcherScratchpad[data]: ${JSON.stringify(data)}`); return data })
    const { data, error } = session ?
        useSWR(`/api/scratchpadData`,
            fetcher, { refreshInterval: 2000 }) :
        { data: undefined, error: undefined }
    return { dataScratchpad: data, errorScratchpad: error }
}

export default function ScratchpadTemp() {
    const [session, loading] = useSession()

    // Getting scratchpad data via SWR
    const { dataScratchpad, errorScratchpad } = useScratchpadSWR(session)

    return (
        <Layout>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <div>
                <Link href='/'>
                    <a>Go back to Home.</a>
                </Link>
            </div>
            <div>
                <Scratchpad scratchpadData={dataScratchpad} />
                {errorScratchpad && <><p class="error">{errorScratchpad}</p></>}
            </div>
        </Layout>)
}
