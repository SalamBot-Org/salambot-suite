/**
 * @file        Page d'accueil du widget web SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import React from 'react';
import ChatBox from '../components/ChatBox';
import styles from './index.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>SalamBot Widget</h1>
        <p>Assistant virtuel intelligent pour les PME marocaines</p>
      </header>
      
      <main className={styles.main}>
        <div className={styles.description}>
          <h2>Bienvenue sur le widget web de SalamBot</h2>
          <p>
            SalamBot est un assistant virtuel conçu pour aider les PME marocaines
            à améliorer leur relation client. Il comprend le français, l&apos;arabe classique
            et le darija marocain.
          </p>
          <p>
            Essayez notre démo ci-dessous en posant une question dans la langue de votre choix.
          </p>
        </div>
        
        <div className={styles.chatBoxWrapper}>
          <ChatBox />
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>© 2025 SalamBot - AI CRM pour les PME Marocaines</p>
      </footer>
    </div>
  );
}
