import React, { useState, useEffect } from 'react'

// import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Layout, { siteTitle } from '../components/layout'
import ListDatasets from '../components/listDatasets'
import utilStyles from '../styles/utils.module.css'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  signIn,
  signOut,
  useSession,
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

import useSWR from 'swr'

const fetcher = (url) => fetch(url)
  .then(res => res.json())
  .then(data => { console.log(`fetcher[data]: ${JSON.stringify(data)}`); return data})

export default function Home() {
  const [session, loading] = useSession()

  const { data , error } = session ? useSWR(`/api/datasets/${session.user.email}`, fetcher, { refreshInterval: 2000 }) : { data: undefined, error: undefined }

  const datasets = data?.datasets

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
        <RenderUserDatasets loggedIn={!!session?.user} datasets={datasets}/>
      </div>
      { error && <><p class="error">{error}</p></>}
    </Layout>
  )
}

function RenderUserDatasets({loggedIn, datasets}) {
  if (!loggedIn)
    return <p>No images visible here..</p>
  else
    if (datasets)
      return <ListDatasets datasets={datasets} />
    else
      return <p>Loading datasets...</p>
}
