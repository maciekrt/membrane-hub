import React, { useState, useEffect } from 'react'

// import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Layout, { siteTitle } from '../components/layout'
import ListDatasets from '../components/listDatasets'
import utilStyles from '../styles/utils.module.css'
import { processDatasets } from '../logic/serverDatasets'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  signIn,
  signOut,
  useSession,
  getSession
} from 'next-auth/client'

function Messaging() {
  const router = useRouter()
  const image_loading = router.query.image_loading ? parseInt(router.query.image_loading) : 0
  const [session, loading] = useSession()

  // Show a toast notification if the image_loading flag is set to 1
  useEffect(() => {
    if (image_loading == 1 && session && !loading) {
      toast.info("I am loading a dataset.. Please refresh in a few minutes.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover:
          true,
        draggable: true,
        progress: undefined
      })
      router.push("/")
    }
  });

  return (
    <>
      <ToastContainer />
    </>
  )
}

export default function Home({ datasets, error }) {
  const router = useRouter()
  const [session, loading] = useSession()

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div><Messaging /></div>
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
            No images visible here.. {error}
          </>}
          {session && <>
            <ListDatasets datasets={datasets} />
          </>
          }
        </>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context) {
  // Call an external API endpoint to get posts.
  // You can use any data fetching library
  const session = await getSession(context);
  if (session) {
    console.log(`index.js: Working on datasets of ${session.user.email}`)
    try {
      var res = processDatasets(session.user.email)
      console.log(`index.js[session]: ${session.user.email}`)
      console.log(`index.js[res]: ${JSON.stringify(res)}`)
      return {
        props: {
          datasets: res['datasets'],
          error: "OK"
        }
      }
    } catch (err) {
      console.log(`index.js: Processing did not work.`)
      return {
        props: {
          datasets: null,
          error: "Processing did not work"
        }
      }
    }
  }
  return {
    props: {
      datasets: null,
      error: "No session"
    }
  }
}
