import Link from 'next/link'
import Image from 'next/image'
import styles from './listDatasets.module.css'

import { useSession } from 'next-auth/client'

export default function ListDatasets({ datasets }) {
   const [session, loading] = useSession()

   function ThumbnailsList({ elem }) {
      return (<>
         { elem.metadata.active == true &&
            [...Array(parseInt(elem.metadata.channels))].map((_, level) => <>
               <Link href={`viewer/${session.user.email}/${elem.imagename}?img_idx=${Math.floor(elem.metadata.z / 2)}&ch_idx=${level}`}><a>
                  <div className={styles.column}>
                     <img src={`/api/images/${session.user.email}/${elem.imagename}/${level}/${Math.floor(elem.metadata.z / 2)}_100x100.png`} />
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
               <th>Dataset name</th>
               <th>Ready</th>
               <th>Segmented</th>
               <th>Channels</th>
            </tr>
         </thead>
         <tbody>
            <> {datasets.map((elem, idx) => (
               <tr>
                  <td>{elem.metadata.active == true &&
                     <Link href={`/viewer/${session.user.email}/${elem.imagename}`}>
                        <a>{elem.imagename}</a>
                     </Link>
                  }
                     {elem.metadata.active == false &&
                        <>{elem.imagename}</>
                     }
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
                     {elem.metadata.masked ? <Image
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
                  <td>{elem.metadata.active === true &&
                     <div className={styles.row}>
                        <ThumbnailsList elem={elem} />
                     </div>
                  }
                     {elem.metadata.active === false &&
                        <>Waiting..</>
                     }
                  </td>
               </tr>))
            }
            </>
         </tbody>
      </table>
   )
}