# Scripts de Synchronisation TODO ↔ Issues GitHub

## 📋 Vue d'ensemble

Ce répertoire contient des scripts pour automatiser la synchronisation entre le fichier `todo.md` et les issues GitHub, implémentant la stratégie d'alignement recommandée.

## 🚀 Script Principal: `sync-todo-issues.ts`

### Fonctionnalités

- **Parsing automatique** du fichier `todo.md`
- **Création de labels** avec code couleur approprié
- **Création de milestones** pour organiser les tâches par priorité
- **Génération d'issues GitHub** avec métadonnées complètes
- **Détection de doublons** pour éviter les créations multiples
- **Mode dry-run** pour prévisualiser les changements

### Structure des Labels

| Label | Couleur | Description |
|-------|---------|-------------|
| `P0-CRITIQUE` | 🔴 Rouge | Priorité critique - À traiter immédiatement |
| `P1-IMPORTANT` | 🟠 Orange | Priorité importante - À traiter rapidement |
| `P2-NICE-TO-HAVE` | 🟡 Jaune | Amélioration souhaitée |
| `ai` | 🟣 Violet | Intelligence artificielle et NLP |
| `backend` | 🔵 Bleu | Développement backend |
| `testing` | 🟢 Vert | Tests et qualité |
| `security` | 🔴 Rouge foncé | Sécurité et authentification |
| `infrastructure` | 🔵 Bleu acier | Infrastructure et DevOps |
| `frontend` | 🩷 Rose | Interface utilisateur |
| `documentation` | 🟣 Violet clair | Documentation technique |

### Milestones

- **Semaine 1-2 (P0 Critique)**: Tâches critiques à compléter en priorité absolue
- **Semaine 3-4 (P1 Important)**: Tâches importantes pour la stabilité du projet
- **Semaine 5-6 (P2 Nice-to-have)**: Améliorations et optimisations

## 🛠️ Utilisation

### Prérequis

1. **GitHub CLI** installé et configuré:
   ```bash
   gh auth login
   ```

2. **Permissions** appropriées sur le repository:
   - Lecture/écriture des issues
   - Gestion des labels et milestones

### Commandes Disponibles

#### 1. Prévisualisation (Dry Run)
```bash
# Via npm script
npm run sync-todo-issues:dry-run

# Ou directement
node dist/sync-todo-issues.js --dry-run
```

#### 2. Synchronisation Complète
```bash
# Via npm script
npm run sync-todo-issues

# Ou directement
node dist/sync-todo-issues.js
```

#### 3. Compilation du Script
```bash
# Compiler le TypeScript
npm run build:sync-script
```

### Workflow Recommandé

1. **Modifier** le fichier `todo.md`
2. **Prévisualiser** les changements:
   ```bash
   npm run sync-todo-issues:dry-run
   ```
3. **Exécuter** la synchronisation:
   ```bash
   npm run sync-todo-issues
   ```
4. **Vérifier** les issues créées sur GitHub

## 📊 Exemple de Sortie

```
🚀 Début de la synchronisation TODO -> Issues GitHub

📋 Création des labels...
✅ Label créé: P0-CRITIQUE
✅ Label créé: ai
✅ Label créé: backend

🎯 Création des milestones...
✅ Milestone créé: Semaine 1-2 (P0 Critique)

📖 Analyse du fichier TODO.md...
   12 tâches trouvées

🔄 Création des issues...
✅ Issue créée: [P0-CRITIQUE] Détection Darija - Implémentation complète
   URL: https://github.com/SalamBot-Org/salambot-suite/issues/50

✅ Synchronisation terminée!
   📊 13 issues créées
   ⏭️  2 tâches ignorées
```

## 🔧 Configuration

### Variables de Configuration

Dans le script `sync-todo-issues.ts`:

```typescript
private repoOwner = 'SalamBot-Org';
private repoName = 'salambot-suite';
private todoPath = path.join(process.cwd(), 'todo.md');
```

### Personnalisation des Labels

Modifiez la méthode `generateLabels()` pour adapter la logique de labellisation:

```typescript
private generateLabels(priority: string, title: string): string[] {
  const labels = [priority === 'P0' ? 'P0-CRITIQUE' : 'P1-IMPORTANT'];
  
  // Ajoutez votre logique personnalisée ici
  if (title.includes('CustomKeyword')) labels.push('custom-label');
  
  return labels;
}
```

## 🚨 Bonnes Pratiques

1. **Toujours exécuter en dry-run** avant la synchronisation complète
2. **Vérifier les permissions GitHub** avant l'exécution
3. **Maintenir le fichier todo.md** comme source de vérité
4. **Utiliser les milestones** pour organiser le travail par sprints
5. **Réviser régulièrement** l'alignement entre TODO et issues

## 🔄 Maintenance

### Mise à Jour du Script

1. Modifier `scripts/sync-todo-issues.ts`
2. Recompiler: `npm run build:sync-script`
3. Tester en dry-run: `npm run sync-todo-issues:dry-run`
4. Exécuter: `npm run sync-todo-issues`

### Nettoyage

Pour supprimer les issues générées automatiquement:

```bash
# Lister les issues avec le label P0-CRITIQUE
gh issue list --label "P0-CRITIQUE"

# Fermer une issue spécifique
gh issue close <issue-number>
```

## 📚 Ressources

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Issues API](https://docs.github.com/en/rest/issues)
- [Fichier TODO.md](../todo.md)
- [Issues GitHub du Projet](https://github.com/SalamBot-Org/salambot-suite/issues)