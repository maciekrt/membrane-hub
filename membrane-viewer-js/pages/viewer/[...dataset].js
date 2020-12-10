import React from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import Layout, { siteTitle } from '../../components/layout'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';

import { useSession, getSession } from 'next-auth/client'

import { Dims } from '../../viewer_model/viewerModel'

export default function Dataset({ name, levels, images, error }) {
    const [session, loading] = useSession()
    var [idx, setIdx] = useState(0)
    var [imIdx, setImIdx] = useState(0)
    var labels = ['00','01']
    
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
                <p>Name is {name}. Error MSG {error}. Current {labels[idx]} Levels: 
                    <>
                    { labels.map((elem, i) => 
                        <button onClick={() => setIdx(i)}>{elem}</button>
                    )
                    }
                    </>
                </p>
                <> 
                    { error=='Fine' && <>
                        <ImageGallery items={images[idx]} slideDuration={50} showPlayButton={false}
                            showIndex={true} startIndex={0} lazyLoad={true} />  </>
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
            files = ['00','01'].map( (elem, idx) => {
                var rawFileCSV = fs.readFileSync(`${FOLDER}${session.user.email}/${name}/${elem}/images.csv`)
                console.log(`CSV: ${FOLDER}${session.user.email}/${name}/${elem}/images.csv`)
                const parse = require('csv-parse/lib/sync')
                const records = parse(rawFileCSV, {
                    columns: true,
                    skip_empty_lines: true
                })
                var filesTemp = records.map(file =>
                    ({
                        original: `/api/images/${name}/${elem}/${file['name']}_x1.png`,
                        thumbnail: `/api/images/${name}/${elem}/${file['name']}_100x100.png`
                    })
                )
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
    if(files.length > 0) {
        console.log(`Dataset[images]:`)
        files.forEach(file => {
            console.log(file.original)
        });
    }
    return {
        props: {
            name : name,
            levels: ['00','01'],
            images: files,
            error: error
        }
    }
}
