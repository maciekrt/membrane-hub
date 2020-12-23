import '../styles/global.css'
import 'react-notifications/lib/notifications.css';
import { Provider } from 'next-auth/client'

export default function App({ Component, pageProps }) {
    return (
        <Provider session={pageProps.session}>
            <Component {...pageProps} />
        </Provider>
    )
}