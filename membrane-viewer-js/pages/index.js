import React, { useState, useEffect } from 'react'

// import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useSWR from 'swr'

import Layout, { siteTitle } from '../components/layout'
import ListDatasets from '../components/listDatasets'
import utilStyles from '../styles/utils.module.css'
import { translate } from '../logic/auxiliary'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  signIn,
  signOut,
  useSession,
} from 'next-auth/client'


function Messaging() {
  const router = useRouter()
  const [session, loading] = useSession()
  // Show a toast notification if the image_loading flag is set to 1
  useEffect(() => {
    const image_loading = router.query.image_loading ? parseInt(router.query.image_loading) : 0
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


const fetcherMine = (url) =>
  fetch(url).then(res => res.json())

function useMyDatasets(session) {
  const { data, error } = useSWR(`/api/datasets/mine`, 
    (url) => fetcherMine(url), 
    { refreshInterval: 2000, data: undefined, error: undefined }) 
  return { dataMine: data, errorMine: error }
}


const fetcherTheirs = (url) =>
  fetch(url).then(res => res.json())

function useTheirDatasets(session) {
  const { data, error } = useSWR(`/api/datasets/theirs`,
    (url) => fetcherTheirs(url), 
    { refreshInterval: 2000, data: undefined, error: undefined })
  return { dataTheirs: data, errorTheirs: error }
}


export default function Home() {
  // Rule of Hooks violated here by useDatasetsSWR (session additional useSWR )
  // Correct this!
  const [session, loading] = useSession()
  // Getting datasets via SWR
  const { dataMine, errorMine } = useMyDatasets(session)
  const { dataTheirs, errorTheirs } = useTheirDatasets(session)
  const datasets = dataMine?.datasets
  const datasetsTheirs = dataTheirs?.datasets
  const isGkk = session?.user?.email == 'grzegorz.kossakowski@gmail.com'

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
        <meta property="og:title" content="Membrane Hub" />
        <meta property="og:url" content="https://hub.membrane.computer" />
        <meta property="og:image" content="https://hub.membrane.computer/opengraph.png" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="Data Membrane is a platform for sharing and processing biological imaging" />
        <meta property="fb:app_id" content="180061987205320" />
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
        <RenderUserDatasets user={session?.user} datasets={datasets} />
        {errorMine && <><p class="error">{errorMine}</p></>}
      </div>
      {/* TODO: for demo purposes, remove this once the demo is done */}
      {!isGkk &&
      <div>
        <RenderOthersDatasets loggedIn={!!session?.user} datasetsTheirs={datasetsTheirs} />
        {errorTheirs && <><p class="error">{errorTheirs}</p></>}
      </div>
      }
    </Layout>
  )
}

function RenderUserDatasets({ user, datasets }) {
  if (!user)
    return <p>My images are not yet visible here..</p>
  else
    if (datasets)
      return <ListDatasets email={user?.email} datasets={datasets} />
    else
      return <p>Loading my datasets...</p>
}

function RenderOthersDatasets({ loggedIn, datasetsTheirs }) {
  if (!loggedIn)
    return <p>Their images are not yet visible here..</p>
  else
    if (datasetsTheirs) {
      return datasetsTheirs.map((dataOther,_) => <>
          <p>{translate(dataOther.email)}'s uploads</p>
          <ListDatasets email={dataOther.email} datasets={dataOther.datasets} />
        </>)
    }
    else
      return <p>Loading their datasets...</p>
}
