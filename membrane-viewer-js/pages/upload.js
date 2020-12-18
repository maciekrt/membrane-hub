import React from 'react'
import { useState } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useSession, getSession } from 'next-auth/client'
import Layout, { siteTitle } from '../components/layout'

export default function Dataset({ name, levels, images, error }) {
    const [session, loading] = useSession()
    const [url, setUrl] = useState('Input a Google Drive link')
    const [flagGDrive, setFlagGDrive] = useState(true)

    const toggleFlagGDrive = (e) => {
        setFlagGDrive(!flagGDrive)
    }

    const upload = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('api/upload', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gdrive: flagGDrive,
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
                    <input type="checkbox" id="scales" name="scales" value="GDrive toggle"
                            onChange={() => toggleFlagGDrive()} checked={flagGDrive} />
                    {flagGDrive && <p>Google Drive.</p> }
                    {!flagGDrive && <p>Random upload.</p>}
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
