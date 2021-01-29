import Link from 'next/link'
import Image from 'next/image'
import styles from './listDatasets.module.css'

import { useSession } from 'next-auth/client'

export default function ListDatasets({ email, datasets }) {

   function ThumbnailsList({ elem }) {
      return (<>
         { elem.metadata.active == true &&
            [...Array(parseInt(elem.metadata.channels))].map((_, level) => <>
               <Link href={`viewer/${email}/${elem.imagename}?img_idx=${Math.floor(elem.metadata.z / 2)}&ch_idx=${level}`}><a>
                  <div className={styles.column}>
                     <img src={`/api/images/${email}/${elem.imagename}/${level}/${Math.floor(elem.metadata.z / 2)}_100x100.png`} />
                     <figcaption className={styles.caption}>{level + 1}</figcaption>
                  </div></a>
               </Link></>
            )}
         { elem.metadata.active === false && <>Waiting..</>}
      </>)
   }

   return (
      <table className={styles.styleTable}>
         <thead>
            <tr>
               <th>Dataset Name</th>
               <th>Ready</th>
               <th>Segmented</th>
               <th>Algorithm</th>
               <th>Channel list</th>
            </tr>
         </thead>
         <tbody>
            <> {datasets.map((elem, idx) => (
               <tr>
                  <td>
                     { elem.metadata.active == true &&
                        <Link href={`/viewer/${email}/${elem.imagename}`}>
                           <a>{elem.imagename}</a>
                        </Link>
                     }
                     { elem.metadata.active == false && <>{elem.imagename}</> }
                  </td>
                  <td>
                     {elem.metadata.active ? <Image
                        src="/tick.png"
                        alt="Yes"
                        width={30}
                        height={30}
                     /> : <Image
                           src="/cross.png"
                           alt="No"
                           width={30}
                           height={30}
                        />}
                  </td>
                  <td>
                     {elem.metadata.masked || elem.metadata.masked3d ? <Image
                        src="/tick.png"
                        alt="Yes"
                        width={30}
                        height={30}
                     /> : <Image
                           src="/cross.png"
                           alt="No"
                           width={30}
                           height={30}
                        />}
                  </td>
                  <td>
                     { elem.metadata.masked && <p>2D stitched</p> }
                     { elem.metadata.masked3d && <p>3D at once</p> }
                     { !!elem.metadata.mask_3D_conv_clipped && <p>3D (manually denoised)</p>}
                     { !!elem.metadata.outlines && <p>outlines</p>}
                     { !!elem.metadata.outlines_conv_clipped && <p>outlines (manually denoised)</p>}
                  </td>
                  <td>
                     { elem.metadata.active === true &&
                        <div className={styles.row}>
                           <ThumbnailsList elem={elem} />
                        </div>
                     }
                     { elem.metadata.active === false && <>Waiting..</> }
                  </td>
               </tr>))
            }
            </>
         </tbody>
      </table>
   )
}