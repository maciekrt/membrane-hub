import React from 'react'
import { useState } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, getSession } from 'next-auth/client'

import Layout, { siteTitle } from '../../components/layout'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';
import styled from 'styled-components'
import { processImages } from '../../logic/serverImages'

function ToggleVariables({urlBase, varName, varVals, defaultVal, varLabels, others, defaultVals}) {
    const router = useRouter()
    const othersValues = {}
    const valCur = router.query[varName] ? router.query[varName] : defaultVal
    var url = `${urlBase}?`

    for(var i = 0; i<others.length; i++) {
        var variable = others[i]
        othersValues[variable] = router.query[variable] ? router.query[variable] : defaultVals[i]
        url += `${variable}=${othersValues[variable]}&`
    }
    return (
        <>{ 
            varVals.map((val, i) => {
                const urlTemp = `${url}${varName}=${val}`
                const add = (i === 0) ? "" : " / "
                if(valCur == val) 
                    return <>{add}{varLabels[i]}</>
                else
                    return <>{add}<Link href={urlTemp} shallow scroll={false}>{varLabels[i]}</Link></>
            }) 
        }</>
    )
}

export default function Dataset({ name, file, error, metadata, images }) {
    const [session, loading] = useSession()
    // var [masked, setMasked] = useState('unmasked')
    const router = useRouter()
    const imgIdx = router.query.img_idx ? parseInt(router.query.img_idx) : 0
    const chIdx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0
    const masked = router.query.mask_val ? router.query.mask_val : "unmasked"

    function ourOnSlide(idx) {
        const channel_idx = router.query.ch_idx ? parseInt(router.query.ch_idx) : 0
        const mask_val = router.query.mask_val ? router.query.mask_val : "unmasked"
        router.push(`/viewer/${name}/${file}/?img_idx=${idx}&ch_idx=${channel_idx}&mask_val=${mask_val}`, undefined, { shallow: true })
    }

    function ToggleChannel() {
        return <ToggleVariables urlBase={`/viewer/${name}/${file}/`}
            varName={'ch_idx'}
            varVals={[0, 1]}
            defaultVal={0}
            varLabels={["1", "2"]}
            others={['img_idx', 'mask_val']}
            defaultVals={['0', 'unmasked']} />
    }

    function ToggleMasked() {
        return <ToggleVariables urlBase={`/viewer/${name}/${file}/`}
            varName={`mask_val`}
            varVals={["unmasked", "mask2D", "mask3D"]}
            defaultVal={`unmasked`}
            varLabels={["unmasked", "2D masks", "3D masks"]}
            others={['ch_idx', 'img_idx']}
            defaultVals={[0, 0]} />
    }

    const GalleryWrapper = styled.div`
                .image-gallery {
                    width: 800px;
                    height: 800px;
                }   

                .image-gallery-slide img {
                    width: 800px;
                    height: 800px;
                    object-fit: cover;
                    overflow: hidden;
                    object-position: center center;
                }

                .fullscreen .image-gallery-slide img {
                    max-height: 100vh;
                }`

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
                                <GalleryWrapper><ImageGallery items={images[chIdx].mask2D} slideDuration={50}
                                    showPlayButton={false} showIndex={true}
                                    startIndex={imgIdx} lazyLoad={true} onSlide={ourOnSlide} />
                                </GalleryWrapper>
                            }
                            {masked == 'mask3D' &&
                                <GalleryWrapper><ImageGallery items={images[chIdx].mask3D} slideDuration={50}
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
            if (domainMe != domainLink) {
                throw new Error("wrong domains")
            } else {
                console.log("api/viewer: Security verification successful.")
            }
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
