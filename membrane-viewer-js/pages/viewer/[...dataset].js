import React from 'react'
import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, getSession } from 'next-auth/client'
import { securityCheck } from '../../logic/security'

import Layout, { siteTitle } from '../../components/layout'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';
import styled from 'styled-components'
import { processImages } from '../../logic/serverImages'

import Headers from './headers'

// variable = { name: "...", values: [....], default: val, , labels: [] }
// others = { names: [], default: [] }
function ToggleVariables({urlBase, variable, others}) {
    const router = useRouter()
    const valCur = router.query[variable.name] 
        ? router.query[variable.name] 
        : variable.default
    var url = `${urlBase}?`

    for(var i = 0; i<others.names.length; i++) {
        var varName = others.names[i]
        var varVal = router.query[varName] 
            ? router.query[varName] 
            : others.default[i]
        url += `${varName}=${varVal}&`
    }
    return (
        <>{ 
            variable.values.map((val, i) => {
                const urlTemp = `${url}${variable.name}=${val}`
                const add = (i === 0) ? "" : " / "
                if(valCur == val) 
                    return <>{add}{variable.labels[i]}</>
                else
                    return <>{add}<Link href={urlTemp} as={urlBase} scroll={false} shallow>
                        {variable.labels[i]}
                        </Link></>
            }) 
        }</>
    )
}

export default function Dataset({ name, file, error, metadata, images }) {
    const [session, loading] = useSession()
    const router = useRouter()
    const imgIdx = router.query.img_idx ? parseInt(router.query.img_idx) : 0
    const chIdx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0
    const masked = router.query.mask_val ? router.query.mask_val : "unmasked"

    function ourOnSlide(idx) {
        const baseUrl = `/viewer/${name}/${file}/`
        const channel_idx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0
        const mask_val = router.query.mask_val ? router.query.mask_val : "unmasked"
        router.push(`${baseUrl}?img_idx=${idx}&ch_idx=${channel_idx}&mask_val=${mask_val}`, baseUrl, { shallow: true })
    }

    // variable = { name: "...", values: [....], default: val, , labels: [] }
// others = { names: [], default: [] }
    function ToggleChannel() {
        const channels = [...Array(metadata.channels).keys()]
        const labels = channels.map((_, i) => { return `${i+1}`})
        return <ToggleVariables urlBase={`/viewer/${name}/${file}/`}
            variable={{ name: "ch_idx", values: channels, default: 0, labels: labels}}
            others={{ names: ['img_idx', 'mask_val'], default: [0, "unmasked"]}} />
    }

    function ToggleMasked() {
        if (metadata.masked === true || metadata.masked3d === true) {
            const vals = ["unmasked"]
            const labels = ["unmasked"]
            if(metadata.masked === true) {
                vals.push("mask2D")
                labels.push("2D masks")
            }
            if(metadata.masked3d === true) {
                vals.push("mask3D")
                labels.push("3D masks")
            }
            return <ToggleVariables urlBase={`/viewer/${name}/${file}/`}
                variable={{ name: "mask_val", values: vals,
                    default: "unmasked", labels: labels}}
                others={{names: ["ch_idx", "img_idx"], default: [0, 0]}} />
        }
        return <></>
    }

    const GalleryWrapper = styled.div`
                .image-gallery {
                    min-width: 800px;
                    min-height: 800px;
                }   

                .image-gallery-slide img {
                    min-width: 800px;
                    min-height: 800px;
                    object-fit: cover;
                    overflow: hidden;
                    object-position: center center;
                }

                .fullscreen .image-gallery-slide img {
                    max-height: 100vh;
                }`

    return (
        <Layout>
            <Headers name={name} file={file} />
            <div>
                <Link href='/'>
                    <a>Go back to Home.</a>
                </Link>
            </div>
            <div>
                {session &&
                    <>
                        {error == 'OK' && <>
                            <p>{name} / {file} / {chIdx + 1} </p>
                            {name != session.user.email && <p>Shared with {session.user.email}</p>}
                            <p>
                                {metadata.active === true && <>Active | </>}
                                <ToggleChannel /> | <ToggleMasked />
                            </p>
                            {masked == 'unmasked' &&
                                <GalleryWrapper><ImageGallery items={images[chIdx].unmasked}
                                  slideDuration={50} showPlayButton={false} showIndex={true}
                                    startIndex={imgIdx} lazyLoad={true} onSlide={ourOnSlide} />
                                </GalleryWrapper>
                            }
                            {masked == 'mask2D' &&
                                <GalleryWrapper>
                                    <ImageGallery items={images[chIdx].mask2D} slideDuration={50}
                                        showPlayButton={false} showIndex={true} 
                                        startIndex={imgIdx} lazyLoad={true} onSlide={ourOnSlide} />
                                </GalleryWrapper>
                            }
                            {masked == 'mask3D' &&
                                <GalleryWrapper>
                                    <ImageGallery items={images[chIdx].mask3D} slideDuration={50}
                                    showPlayButton={false} showIndex={true}
                                    startIndex={imgIdx} lazyLoad={true} onSlide={ourOnSlide} />
                                </GalleryWrapper>
                            }
                        </>}
                        {error != 'OK' && <><p>{error}</p> </>}
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

    console.log(`api/viewer: Working on ${name.join('/')}`)

    if (session) {
        console.log(`api/viewer: Security check for ${session.user.email} ${name[0]}`)
        // Those two are necessary for our current security policy.
        // Should be replaced by some honest security module.
        const domainMe = session.user.email.split("@")[1]
        const domainLink = name[0].split("@")[1]

        try {
            securityCheck(name[0], session.user.email)
            // if (domainMe != domainLink) {
            //     throw new Error("wrong domains")
            // } else {
            //     console.log("api/viewer: Security verification successful.")
            // }
            const imagesJSON = processImages(name[0], name[1])
            console.log(`api/viewer[images]: ${JSON.stringify(imagesJSON['images'])}`)
            console.log(`api/viewer: Success.`)
            return {
                props: {
                    name: name[0],
                    file: name[1],
                    error: "OK",
                    metadata: imagesJSON['metadata'],
                    images: imagesJSON['images']
                }
            }
        } catch (err) {
            console.log(`api/viewer: Not such file error. ${err.message}`)
            return { props: { error: "Not such a file" } }
        }
    } else {
        console.log('api/viewer: Not logged in..')
        return { props: { error: "Not logged in" } }
    }
}
