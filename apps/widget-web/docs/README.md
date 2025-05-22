/**
 * @file        Documentation du widget web SalamBot avec instructions pour la langue.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

# Widget Web SalamBot

Ce widget permet d'intégrer le chatbot SalamBot dans n'importe quelle page web avec détection automatique de la langue.

## Installation

```bash
pnpm install
pnpm dev
```

## Utilisation

### Intégration dans une page web

```html
<iframe 
  src="https://widget.salambot.ma" 
  width="400" 
  height="600" 
  frameborder="0"
></iframe>
```

### Forcer la langue manuellement

Pour forcer la langue manuellement dans le widget :

```javascript
// Accéder au store de langue
const languageStore = window.salambot.languageStore;

// Forcer une langue spécifique
languageStore.setLangOverride('fr');  // Français
languageStore.setLangOverride('ar');  // Arabe
languageStore.setLangOverride('ar-ma');  // Darija
```

## Fonctionnalités

- Détection automatique de la langue (français, arabe, darija)
- Adaptation de l'interface selon la langue détectée
- Support des directions LTR et RTL
- Escalade vers un agent humain si nécessaire
