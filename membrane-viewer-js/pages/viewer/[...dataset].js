import React from 'react'
import { useState } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, getSession } from 'next-auth/client'

import Layout, { siteTitle } from '../../components/layout'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';

import { Dims } from '../../viewer_model/viewerModel'

export default function Dataset({ name, levels, galleryImages, error }) {
    const [session, loading] = useSession()
    var [masked, setMasked] = useState(0)
    const router = useRouter()
    const imgIdx = router.query.img_idx ? parseInt(router.query.img_idx) : 0
    const chIdx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0
    var labels = ['00','01']

    function ourOnSlide(cur) {
        const chIdx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0
        router.push(`/viewer/${name}/?img_idx=${cur}&ch_idx=${chIdx}`, undefined, { shallow: true })
    }

    function toggleChannel(elem, i) {
        var add = " or "
        if (i == 0) {
            add = " "
        }
        const cur = router.query.img_idx ? parseInt(router.query.img_idx) : 0
        return <>
            {add}
            <a href={`/viewer/${name}/?img_idx=${cur}&ch_idx=${i}`}>{elem}</a>
            </>
    }

    function toggleMasked() {
        if(masked == 0) {
            return <><a onClick={() => setMasked(1)}>masked</a> / unmasked</>
        }
        return <>masked / <a onClick={() => setMasked(0)}>unmasked</a></>
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
            {session && <>
                <p>{session.user.email} / {name} / {labels[chIdx]}</p>
                <p>[channel: <>{ labels.map(toggleChannel) }</>, {toggleMasked()}]</p>
                <> 
                    { error=='Fine' && <>
                        <ImageGallery items={galleryImages[chIdx][masked]} slideDuration={50} showPlayButton={false}
                            showIndex={true} startIndex={imgIdx} lazyLoad={true} onSlide={ourOnSlide} />  </>
                    }
                </>
            </>
            }
            {!session && <>
                    <p>Login mate pleaaase :) Error MSG {error}.</p>
            </>}
            </div>
        </Layout>)
}

// PAD 2
function pad(num) {
    return ("00" + num).slice(-2) 
}

export async function getServerSideProps(context) {
    const req = context.req
    const session = await getSession({ req })
    var files = []
    var error = "Fine"
    var name = context.params.dataset

    if(session) {
        console.log(`Viewer: ${session.user.email}`)
        // SOME SECURITY
        const FOLDER = process.env.IMAGES_FOLDER;
        var fs = require('fs');
        try {
                const metadataFile = fs.readFileSync(`${FOLDER}${session.user.email}/${name}/metadata.json`)
                const metadata = JSON.parse(metadataFile)
                files = ['00','01'].map( (elem, idxChannels) => {
                    console.log(`Metadata: ${metadata}`)
                    var filesTemp = [false, true].map((flag, idxMask) => {
                        var add = ""
                        if(flag) {
                            add = "_masked"
                        }
                        console.log(metadata.z, `/api/images/${name}/${elem}/${pad(0)}${add}_x1.png`)
                        var arr = [...(new Array(parseInt(metadata.z)))].map((sth, idx) => ({
                            original: `/api/images/${name}/${elem}/${pad(idx)}${add}_x1.png`,
                            thumbnail: `/api/images/${name}/${elem}/${pad(idx)}${add}_100x100.png`
                        }))
                        return arr
                    })
                    return filesTemp
                }
            )
        } catch(err) {
            error = "NOT_SUCH_FILE"
            console.log(`Not such file error. ${err.message}`)
        }
    } else {
        error = "LOG_IN_ERROR"
        console.log('Not logged in..')
    }
    return {
        props: {
            name : name,
            levels: ['00','01'],
            galleryImages: files,
            error: error
        }
    }
}

                    // var rawFileCSV = fs.readFileSync(`${FOLDER}${session.user.email}/${name}/${elem}/images.csv`)
                    // console.log(`CSV: ${FOLDER}${session.user.email}/${name}/${elem}/images.csv`)
                    // const parse = require('csv-parse/lib/sync')
                    // const records = parse(rawFileCSV, {
                    //     columns: true,
                    //     skip_empty_lines: true
                    // })
