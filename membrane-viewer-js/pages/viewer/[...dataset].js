import React from 'react'

import Head from 'next/head'
import Link from 'next/link'
import Layout, { siteTitle } from '../../components/layout'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';

import { useSession, getSession } from 'next-auth/client'

export default function Dataset({ name, images}) {
    const [session, loading] = useSession()
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
                <p>Name is {name}</p>
                <ImageGallery items={images} slideDuration={50} showPlayButton={false}
                    showIndex={true} startIndex={0} lazyLoad={true} />  
            </>}
            {!session && <>
                <p>Login mate pleaaase :)</p>
            </>}
            </div>
        </Layout>)
}

export async function getServerSideProps(context) {
    const req = context.req
    const session = await getSession({ req })
    var files = []
    var name = context.params.dataset

    if(session) {
        console.log(`Viewer: ${session.user.email}`)
        // SOME SECURITY
        const FOLDER = process.env.IMAGES_FOLDER;
        var fs = require('fs');
        var rawFileCSV = fs.readFileSync(`${FOLDER}${session.user.email}/${name}/images.csv`)
        console.log(`CSV: ${FOLDER}${session.user.email}/${name}/images.csv`)
        const parse = require('csv-parse/lib/sync')
        const records = parse(rawFileCSV, {
            columns: true,
            skip_empty_lines: true
        })
        files = records.map(file =>
            ({
                original: `/api/images/${session.user.email}/${name}/${file['name']}_x1.png`,
                thumbnail: `/api/images/${session.user.email}/${name}/${file['name']}_100x100.png`
            })
        )
    } else {
        console.log('Not logged in..')
    }
    console.log(`Dataset[images]:`)
    files.forEach(file => {
        console.log(file.original)
    });
    return {
        props: {
            name : context.params.dataset,
            images: files
        }
    }
}
