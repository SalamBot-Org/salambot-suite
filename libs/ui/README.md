# 🎨 SalamBot UI - Design System

**Système de design unifié et composants React pour l'écosystème SalamBot**

_Bibliothèque de composants modernes, accessibles et optimisés pour les interfaces multilingues (Français, Arabe, Darija)._

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Storybook](https://img.shields.io/badge/Storybook-7.x-FF4785.svg)](https://storybook.js.org/)
[![Accessibility](https://img.shields.io/badge/a11y-WCAG%202.1-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

## 🌟 Fonctionnalités

### 🎯 **Composants Spécialisés SalamBot**

- **ChatBubble** : Bulles de conversation avec support bi-script
- **LanguageDetector** : Indicateur visuel de langue détectée
- **DarijaKeyboard** : Clavier virtuel pour saisie Darija
- **AgentStatus** : Indicateurs de statut agent temps réel

### 🌍 **Support Multilingue Natif**

- **RTL/LTR** : Basculement automatique selon la langue
- **Fonts optimisées** : Noto Sans Arabic + Inter pour performance
- **Tokens i18n** : Espacement et tailles adaptés par script
- **Direction-aware** : Composants qui s'adaptent au sens de lecture

### ♿ **Accessibilité Premium**

- **WCAG 2.1 AA** : Conformité complète
- **Screen readers** : Support NVDA, JAWS, VoiceOver
- **Keyboard navigation** : Navigation clavier complète
- **High contrast** : Mode contraste élevé intégré

## 📦 Composants Disponibles

### 🔤 **Typography**

```typescript
import { Heading, Text, Label } from '@salambot/ui';

<Heading level={1} variant="display">عنوان رئيسي</Heading>
<Text size="lg" weight="medium">Texte en français</Text>
<Label required>Champ obligatoire</Label>
```

### 🎛️ **Form Controls**

```typescript
import { Input, Select, Textarea, Checkbox } from '@salambot/ui';

<Input
  placeholder="اكتب رسالتك هنا"
  dir="rtl"
  langDetect
/>
<Select
  options={languages}
  placeholder="Choisir une langue"
/>
<Textarea
  placeholder="Tapez votre message en darija..."
  autoResize
  langHint
/>
```

### 💬 **Chat Components**

```typescript
import { ChatBubble, TypingIndicator, MessageStatus } from '@salambot/ui';

<ChatBubble
  message="salam khouya, kifach nta?"
  sender="user"
  language="darija-latin"
  timestamp={new Date()}
/>
<TypingIndicator agent="Agent Sarah" />
<MessageStatus status="delivered" />
```

### 🎨 **Layout & Navigation**

```typescript
import { Card, Modal, Sidebar, Tabs } from '@salambot/ui';

<Card variant="elevated" padding="lg">
  <Tabs
    items={[
      { id: 'fr', label: 'Français', icon: '🇫🇷' },
      { id: 'ar', label: 'العربية', icon: '🇲🇦' },
      { id: 'darija', label: 'Darija', icon: '💬' },
    ]}
  />
</Card>;
```

### 📊 **Data Display**

```typescript
import { Badge, Avatar, Progress, Stats } from '@salambot/ui';

<Badge variant="success" size="sm">En ligne</Badge>
<Avatar
  name="أحمد المغربي"
  status="online"
  size="lg"
/>
<Progress value={88} label="Précision Darija" />
<Stats
  metrics={[
    { label: 'Conversations', value: '1,234' },
    { label: 'Satisfaction', value: '94%' }
  ]}
/>
```

## 🎨 Design Tokens

### Couleurs SalamBot

```css
:root {
  /* Primary - Bleu Marocain */
  --salambot-primary-50: #eff6ff;
  --salambot-primary-500: #2d5a87;
  --salambot-primary-900: #1e3a5f;

  /* Secondary - Orange Berbère */
  --salambot-secondary-50: #fef7ed;
  --salambot-secondary-500: #f4a261;
  --salambot-secondary-900: #c2410c;

  /* Darija - Vert Menthe */
  --salambot-darija-50: #f0fdf4;
  --salambot-darija-500: #22c55e;
  --salambot-darija-900: #14532d;

  /* Status Colors */
  --salambot-success: #10b981;
  --salambot-warning: #f59e0b;
  --salambot-error: #ef4444;
  --salambot-info: #3b82f6;
}
```

### Typographie

```css
/* Fonts Stack */
--font-arabic: 'Noto Sans Arabic', 'Amiri', serif;
--font-latin: 'Inter', 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Sizes */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
```

### Espacement

```css
/* Spacing Scale */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

## 🚀 Installation & Usage

### Installation

```bash
# Dans votre projet SalamBot
pnpm add @salambot/ui

# Peer dependencies
pnpm add react react-dom tailwindcss
```

### Configuration Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './node_modules/@salambot/ui/**/*.{js,ts,jsx,tsx}'],
  presets: [require('@salambot/ui/tailwind-preset')],
  theme: {
    extend: {
      // Vos customisations
    },
  },
};
```

### Provider Setup

```typescript
// App.tsx
import { SalambotUIProvider } from '@salambot/ui';

function App() {
  return (
    <SalambotUIProvider theme="light" locale="fr" direction="ltr">
      <YourApp />
    </SalambotUIProvider>
  );
}
```

## 🎭 Storybook

### Lancer Storybook

```bash
# Démarrer Storybook
pnpm nx storybook ui

# Build Storybook
pnpm nx build-storybook ui
```

### Stories Disponibles

- **🎨 Design Tokens** : Couleurs, typographie, espacement
- **🔤 Typography** : Headings, Text, Labels
- **📝 Forms** : Inputs, Selects, Textareas
- **💬 Chat** : Bulles, indicateurs, statuts
- **📊 Data** : Badges, avatars, métriques
- **🌍 i18n** : Exemples multilingues

## 🧪 Tests & Qualité

### Tests unitaires

```bash
# Lancer les tests
pnpm nx test ui

# Tests avec coverage
pnpm nx test ui --coverage

# Tests en mode watch
pnpm nx test ui --watch
```

### Tests d'accessibilité

```bash
# Tests a11y avec axe-core
pnpm nx test ui --testNamePattern="accessibility"

# Tests de contraste
pnpm nx test ui --testNamePattern="contrast"
```

### Tests visuels

```bash
# Chromatic visual testing
pnpm nx chromatic ui

# Percy visual testing
pnpm nx percy ui
```

## 🎯 Thèmes & Customisation

### Thème sombre

```typescript
<SalambotUIProvider theme="dark">{/* Vos composants */}</SalambotUIProvider>
```

### Thème personnalisé

```typescript
const customTheme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#0ea5e9',
      900: '#0c4a6e',
    },
  },
  fonts: {
    arabic: 'Cairo, sans-serif',
  },
};

<SalambotUIProvider theme={customTheme}>{/* Vos composants */}</SalambotUIProvider>;
```

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px; /* Tablet */
--breakpoint-md: 768px; /* Desktop */
--breakpoint-lg: 1024px; /* Large Desktop */
--breakpoint-xl: 1280px; /* Extra Large */
```

### Usage

```typescript
<Card className="p-4 md:p-6 lg:p-8">
  <Text size={{ base: 'sm', md: 'base', lg: 'lg' }}>Texte responsive</Text>
</Card>
```

## 🔧 Développement

### Structure du projet

```
libs/ui/
├── src/
│   ├── components/          # Composants React
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ...
│   ├── tokens/              # Design tokens
│   ├── hooks/               # Hooks utilitaires
│   ├── utils/               # Fonctions utilitaires
│   └── index.ts             # Exports publics
├── stories/                 # Stories Storybook
├── tests/                   # Tests unitaires
└── tailwind-preset.js       # Preset Tailwind
```

### Contribuer

1. **Créer un composant** : Suivre le template dans `/templates`
2. **Ajouter des tests** : Tests unitaires + accessibilité
3. **Créer une story** : Documentation Storybook
4. **Mettre à jour les tokens** : Si nouveaux tokens design

## 📚 Ressources

- **Storybook** : [ui.salambot.ma](https://ui.salambot.ma)
- **Figma** : [Design System SalamBot](https://figma.com/salambot-ds)
- **Guidelines** : [Design Guidelines](../../../docs/design-guidelines.md)
- **Accessibility** : [A11y Checklist](../../../docs/accessibility.md)

## 🤝 Support

- **Issues** : [GitHub Issues](https://github.com/SalamBot-Org/salambot-suite/issues)
- **Discord** : [#design-system](https://discord.gg/salambot)
- **Email** : design@salambot.ma
