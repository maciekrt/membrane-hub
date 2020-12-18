import React, { useState } from 'react'

// import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Layout, { siteTitle } from '../components/layout'
import ListDatasets from '../components/listDatasets'
import utilStyles from '../styles/utils.module.css'

import {
  signIn,
  signOut,
  useSession,
  getSession
} from 'next-auth/client'

export default function Home({ images, dirs, levels}) {
  const router = useRouter()
  const imageIdx = router.query.counter ? parseInt(router.query.counter) : 0
  const [session, loading] = useSession()

  function ourOnSlide(idx) {
    // console.log(`Image number ${idx}`)
    // useEffect(() => {
    //   // Always do navigations after the first render
    //   router.push(`/?counter=${idx}`, undefined, { shallow: true })
    // }, [])
    router.push(`/?counter=${idx}`, undefined, { shallow: true })
  }
  
  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div className={utilStyles.grid}>
        {session && <> 
        <Link href="/upload">
          <a className={utilStyles.card}>
            <h3>Upload a file</h3>
            <p>Uploading a nuclei image and the corresponding labelling.</p>
          </a>
        </Link>
        </>
        }
        {!session &&
          <Link href="/" >
          <a className={utilStyles.card} onClick={signIn}>
            <h3>Log in</h3>
            <p>We are currently supporting log in using Google.</p>
          </a>
          </Link>
        }
        {session &&
          <Link href="/">
            <a className={utilStyles.card} onClick={signOut}>
              <h3>Log out</h3>
              <p>You are logged in as {session.user.email}</p>
            </a>
          </Link>
        }  
      </div>
      <div>
        <>
          {!session && <>
            No images visible here..
          </>}
          {session && 
            <> 
              <ListDatasets dirs={dirs} levels={levels}/>
            </>}
        </> 
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context) {
    // Call an external API endpoint to get posts.
    // You can use any data fetching library
    // const res = await fetch('https://.../posts')
    // const posts = await res.json()
    const session = await getSession(context);

    var dirs = []
    if (session) {
      const FOLDER = process.env.IMAGES_FOLDER;
      var fs = require('fs');
      dirs = fs.readdirSync(`${FOLDER}${session.user.email}`);
    }
    // This is hardcoded WOW!!
    var levels = dirs.map((dir) => ['00','01'])
    return {
        props: {
          dirs: dirs,
          levels: levels
        }
    }
}
