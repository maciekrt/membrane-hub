import React from 'react'
import { useState } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, getSession } from 'next-auth/client'

import Layout, { siteTitle } from '../../components/layout'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';
import { processImages } from '../../logic/serverImages'

export default function Dataset({ name, file, error, metadata, images }) {
    const [session, loading] = useSession()
    var [masked, setMasked] = useState(0)
    const router = useRouter()
    const { dataset } = router.query
    const imgIdx = router.query.img_idx ? parseInt(router.query.img_idx) : 0
    const chIdx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0

    
    function ourOnSlide(cur) {
        const chIdx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0
        router.push(`/viewer/${name}/${file}/?img_idx=${cur}&ch_idx=${chIdx}`, undefined, { shallow: true })
    }

    function ToggleChannel() {
        const cur = router.query.img_idx ? parseInt(router.query.img_idx) : 0

        return (<> 
            { 
                [...Array(parseInt(metadata.channels))].map((_, i) => {
                    var add = " or "
                    if (i == 0) {
                        add = " "
                    }
                    return <> {add} 
                        <a href={`/viewer/${name}/${file}/?img_idx=${cur}&ch_idx=${i}`}>
                            {i + 1}
                        </a>
                    </>
                })
            } </>
        )
    }

    function ToggleMasked() {
        return (<> { metadata.masked === true &&
            <>  
            <> | </>
            { masked == 1 && <>masked / <a onClick={() => setMasked(0)}>unmasked</a></> }
            { masked == 0 && <><a onClick={() => setMasked(1)}>masked</a> / unmasked</> }
            </> 
        }</>
        )
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
            <>
                { error == 'OK' && <>
                    <p>{name} / {file} / {chIdx + 1} </p>
                    {name != session.user.email && <p>Shared with {session.user.email}</p>}
                    <p> 
                        { metadata.active === true && <>Active | </> }
                        <ToggleChannel />
                        <ToggleMasked />
                    </p>
                    <ImageGallery items={images[chIdx][masked]} slideDuration={50} 
                        showPlayButton={false} showIndex={true} 
                        startIndex={imgIdx} lazyLoad={true} onSlide={ourOnSlide} /> 
                </> } 
                { error != 'OK' && <><p>{error}</p> </> }
            </>
            }
            {!session && <><p>Login mate pleaaase :) Error MSG {error}.</p></>}
            </div>
        </Layout>)
}

export async function getServerSideProps(context) {
    const req = context.req
    const session = await getSession({ req })
    var name = context.params.dataset

    console.log(`Dataset: ${name.join('/')} TUTAJ ${name[0]} ${name[1]}`)

    if(session) {
        console.log(`Viewer: ${session.user.email} ${name}`)
        const domainMe = session.user.email.split("@")[1]
        const domainLink = name[0].split("@")[1]

        try {
            if (domainMe != domainLink) {
                throw new Error("wrong domains")
            } else {
                console.log("Dataset: same domains - OK.")
            }
            const imagesJSON = processImages(session.user.email, name.join('/'))
            console.log(`viewer: Success.`)
            return {
                props: {
                    name: name[0],
                    file: name[1],
                    error: "OK",
                    metadata: imagesJSON['metadata'],
                    images: imagesJSON['images']
                }
            }
        } catch(err) {
            console.log(`Not such file error. ${err.message}`)
            return { props: { error: "Not such a file" } }
        }
    } else {
        console.log('Not logged in..')
        return { props: { error: "Not logged in" } }
    }
}
