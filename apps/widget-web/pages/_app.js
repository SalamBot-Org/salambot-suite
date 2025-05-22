/**
 * @file        Mise à jour du fichier _app.tsx pour intégrer le Layout avec adaptation à la langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import Layout from '../components/Layout';
import '../styles/globals.css';
function MyApp({ Component, pageProps }) {
    return (<Layout>
      <Component {...pageProps}/>
    </Layout>);
}
export default MyApp;
//# sourceMappingURL=_app.js.map