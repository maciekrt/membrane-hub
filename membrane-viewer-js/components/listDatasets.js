import Link from 'next/link'
import styles from './listDatasets.module.css'

export default function ListDatasets({ dirs, levels }) {
    return ( 
        <table className={styles.styleTable}>
            <thead>
                <tr>
                    <th>Dataset name</th>
                    <th>Link</th>
                    <th>Levels</th>
                </tr>
            </thead>
            <tbody>
            <> { dirs.map((elem, idx) => (
            <tr>
                <td>{elem}</td>
                <td><Link href={`/viewer/${elem}`}>
                    <a>{elem}</a>
                    </Link></td>
                <td>{levels[idx].map((level, idLevel) => `${level} `)}</td>
            </tr>))
            } 
            </>
            </tbody>
        </table>
    )
}