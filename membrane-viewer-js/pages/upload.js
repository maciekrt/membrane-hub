import React from 'react'
import { useState } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, getSession } from 'next-auth/client'
import Layout, { siteTitle } from '../components/layout'

export default function Dataset({ name, levels, images, error }) {
    const [session, loading] = useSession()
    const [url, setUrl] = useState('Input a Google Drive link')

    const upload = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('api/upload', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url
                })
            })

            if (res.status === 200) {
                alert('You uploaded!')
            } else {
                alert('Sorry, something went wrong.')
            }
        } catch (err) {
            alert(err)
        }
    }

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
                {session && 
                    <div>
                        <form>
                            <input id='url' value={url} onChange={e => setUrl(e.target.value)} />
                            <button type='submit' onClick={upload}>Upload</button>
                        </form>
                    </div>
                }
                {!session && <>
                    <p>Login mate pleaaase :) Error MSG {error}.</p>
                </>}
            </div>
        </Layout>)
}
