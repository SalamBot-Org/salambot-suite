/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  🤖 SalamBot - Système de Tagging Intelligent v2.2        │
 * ├─────────────────────────────────────────────────────────────┤
 * │  🎯 Stratégie Optimale: Hybrid Versioning + Business Value │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-04 | Modifié: 2025-06-04                │
 * │  🏷️  v2.2.0 | 🔒 Propriétaire SalamBot Team                │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TagConfig {
  version: string;
  type: 'major' | 'minor' | 'patch';
  businessSuffix?: string;
  description: string;
  features: string[];
  metrics?: {
    performance?: string;
    precision?: string;
    coverage?: string;
    responseTime?: string;
  };
  phase?: string;
}

interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore';
}

class IntelligentTagger {
  private packageJsonPath = path.join(process.cwd(), 'package.json');
  private changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

  /**
   * 🎯 Stratégie Optimale SalamBot: Hybrid Versioning
   * Combine SemVer + Business-oriented suffixes + Creative naming
   */
  async createIntelligentTag(config: TagConfig): Promise<void> {
    console.log('🚀 SalamBot Intelligent Tagging System v2.2');
    console.log('📋 Implémentation de la Stratégie Optimale...');
    
    try {
      // 1. Validation et préparation
      await this.validateEnvironment();
      
      // 2. Analyse des commits récents
      const recentCommits = await this.analyzeRecentCommits();
      
      // 3. Génération du tag hybride
      const hybridTag = this.generateHybridTag(config);
      
      // 4. Création du message enrichi
      const tagMessage = this.generateEnrichedMessage(config, recentCommits);
      
      // 5. Mise à jour du package.json
      await this.updatePackageVersion(config.version);
      
      // 6. Mise à jour du CHANGELOG
      await this.updateChangelog(config, hybridTag);
      
      // 7. Création du tag Git
      await this.createGitTag(hybridTag, tagMessage);
      
      // 8. Génération des release notes automatiques
      await this.generateReleaseNotes(config, hybridTag, recentCommits);
      
      // 9. Métriques et validation
      await this.collectAndDisplayMetrics(config);
      
      console.log(`✅ Tag créé avec succès: ${hybridTag}`);
      console.log('🎉 Stratégie Optimale SalamBot appliquée!');
      
    } catch (error) {
      console.error('❌ Erreur lors du tagging:', error);
      throw error;
    }
  }

  /**
   * 🏷️ Génération du tag hybride selon la stratégie optimale
   * Format: v{semver}[-{business-suffix}] avec créativité contrôlée
   */
  private generateHybridTag(config: TagConfig): string {
    let tag = `v${config.version}`;
    
    // Ajout du suffixe business si spécifié
    if (config.businessSuffix) {
      tag += `-${config.businessSuffix}`;
    }
    
    // Suffixes créatifs selon la phase
    if (config.phase) {
      const creativeNames = {
        'phase1': 'darija-master',
        'phase2': 'qadi-integration', 
        'phase3': 'ai-revolution',
        'hotfix': 'rapid-response',
        'security': 'fortress-shield'
      };
      
      const creativeName = creativeNames[config.phase as keyof typeof creativeNames];
      if (creativeName) {
        tag += `-${creativeName}`;
      }
    }
    
    return tag;
  }

  /**
   * 📝 Génération du message de tag enrichi avec métriques
   */
  private generateEnrichedMessage(config: TagConfig, commits: CommitInfo[]): string {
    const lines = [
      `🚀 SalamBot Release ${config.version}`,
      '',
      `📋 ${config.description}`,
      ''
    ];

    // Ajout des fonctionnalités
    if (config.features.length > 0) {
      lines.push('✨ Nouvelles Fonctionnalités:');
      config.features.forEach(feature => {
        lines.push(`  • ${feature}`);
      });
      lines.push('');
    }

    // Ajout des métriques si disponibles
    if (config.metrics) {
      lines.push('📊 Métriques de Performance:');
      Object.entries(config.metrics).forEach(([key, value]) => {
        const emoji = this.getMetricEmoji(key);
        lines.push(`  ${emoji} ${this.formatMetricName(key)}: ${value}`);
      });
      lines.push('');
    }

    // Statistiques des commits
    const commitStats = this.analyzeCommitStats(commits);
    lines.push('📈 Statistiques de Développement:');
    lines.push(`  📝 Commits: ${commits.length}`);
    lines.push(`  👥 Contributeurs: ${commitStats.contributors}`);
    lines.push(`  🔧 Types: ${commitStats.types.join(', ')}`);
    lines.push('');

    lines.push('🏷️ Tag généré par SalamBot Intelligent Tagging System v2.2');
    lines.push('📧 Contact: info@salambot.ma');

    return lines.join('\n');
  }

  /**
   * 🔍 Analyse des commits récents pour enrichir le tag
   */
  private async analyzeRecentCommits(): Promise<CommitInfo[]> {
    try {
      const gitLog = execSync(
        'git log --oneline --pretty=format:"%H|%s|%an|%ad" --date=short -10',
        { encoding: 'utf8' }
      );

      return gitLog.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, author, date] = line.split('|');
          return {
            hash: hash.substring(0, 8),
            message,
            author,
            date,
            type: this.extractCommitType(message)
          };
        });
    } catch (error) {
      console.warn('⚠️ Impossible d\'analyser les commits récents:', error);
      return [];
    }
  }

  /**
   * 📊 Extraction du type de commit selon Conventional Commits
   */
  private extractCommitType(message: string): CommitInfo['type'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.startsWith('feat')) return 'feat';
    if (lowerMessage.startsWith('fix')) return 'fix';
    if (lowerMessage.startsWith('docs')) return 'docs';
    if (lowerMessage.startsWith('style')) return 'style';
    if (lowerMessage.startsWith('refactor')) return 'refactor';
    if (lowerMessage.startsWith('test')) return 'test';
    if (lowerMessage.startsWith('chore')) return 'chore';
    
    return 'chore'; // default
  }

  /**
   * 📈 Analyse statistique des commits
   */
  private analyzeCommitStats(commits: CommitInfo[]) {
    const contributors = new Set(commits.map(c => c.author)).size;
    const types = [...new Set(commits.map(c => c.type))];
    
    return { contributors, types };
  }

  /**
   * 🎨 Emojis pour les métriques
   */
  private getMetricEmoji(metric: string): string {
    const emojiMap: Record<string, string> = {
      performance: '⚡',
      precision: '🎯',
      coverage: '🛡️',
      responseTime: '⏱️'
    };
    return emojiMap[metric] || '📊';
  }

  /**
   * 📝 Formatage des noms de métriques
   */
  private formatMetricName(metric: string): string {
    const nameMap: Record<string, string> = {
      performance: 'Performance',
      precision: 'Précision Darija',
      coverage: 'Couverture Tests',
      responseTime: 'Temps de Réponse'
    };
    return nameMap[metric] || metric;
  }

  /**
   * 📦 Mise à jour de la version dans package.json
   */
  private async updatePackageVersion(version: string): Promise<void> {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      packageJson.version = version;
      
      fs.writeFileSync(
        this.packageJsonPath,
        JSON.stringify(packageJson, null, 2) + '\n'
      );
      
      console.log(`📦 Version mise à jour: ${version}`);
    } catch (error) {
      throw new Error(`Erreur mise à jour package.json: ${error}`);
    }
  }

  /**
   * 📋 Mise à jour du CHANGELOG
   */
  private async updateChangelog(config: TagConfig, tag: string): Promise<void> {
    try {
      if (!fs.existsSync(this.changelogPath)) {
        console.log('📋 Création du CHANGELOG.md');
        fs.writeFileSync(this.changelogPath, this.generateInitialChangelog());
      }

      const changelog = fs.readFileSync(this.changelogPath, 'utf8');
      const newEntry = this.generateChangelogEntry(config, tag);
      
      // Insertion après la ligne "## [Unreleased]"
      const updatedChangelog = changelog.replace(
        /## \[Unreleased\]/,
        `## [Unreleased]\n\n${newEntry}`
      );
      
      fs.writeFileSync(this.changelogPath, updatedChangelog);
      console.log('📋 CHANGELOG.md mis à jour');
    } catch (error) {
      console.warn('⚠️ Erreur mise à jour CHANGELOG:', error);
    }
  }

  /**
   * 📋 Génération d'une entrée de changelog
   */
  private generateChangelogEntry(config: TagConfig, tag: string): string {
    const date = new Date().toISOString().split('T')[0];
    const lines = [
      `## [${config.version}] - ${date}`,
      '',
      `### ${this.getChangeTypeTitle(config.type)}`,
      ''
    ];

    config.features.forEach(feature => {
      lines.push(`- ${feature}`);
    });

    if (config.metrics) {
      lines.push('');
      lines.push('### Métriques');
      lines.push('');
      Object.entries(config.metrics).forEach(([key, value]) => {
        lines.push(`- ${this.formatMetricName(key)}: ${value}`);
      });
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * 📝 Titre selon le type de changement
   */
  private getChangeTypeTitle(type: string): string {
    const titles = {
      major: 'Changements Majeurs',
      minor: 'Nouvelles Fonctionnalités',
      patch: 'Corrections et Améliorations'
    };
    return titles[type as keyof typeof titles] || 'Changements';
  }

  /**
   * 🏷️ Création du tag Git
   */
  private async createGitTag(tag: string, message: string): Promise<void> {
    try {
      // Création du tag annoté
      execSync(`git tag -a "${tag}" -m "${message}"`, { stdio: 'inherit' });
      console.log(`🏷️ Tag Git créé: ${tag}`);
    } catch (error) {
      throw new Error(`Erreur création tag Git: ${error}`);
    }
  }

  /**
   * 📄 Génération des release notes automatiques
   */
  private async generateReleaseNotes(
    config: TagConfig,
    tag: string,
    commits: CommitInfo[]
  ): Promise<void> {
    const releaseNotesPath = path.join(process.cwd(), 'docs', 'releases', `${tag}.md`);
    
    try {
      // Création du dossier si nécessaire
      const releaseDir = path.dirname(releaseNotesPath);
      if (!fs.existsSync(releaseDir)) {
        fs.mkdirSync(releaseDir, { recursive: true });
      }

      const releaseNotes = this.generateDetailedReleaseNotes(config, tag, commits);
      fs.writeFileSync(releaseNotesPath, releaseNotes);
      
      console.log(`📄 Release notes générées: ${releaseNotesPath}`);
    } catch (error) {
      console.warn('⚠️ Erreur génération release notes:', error);
    }
  }

  /**
   * 📄 Génération détaillée des release notes
   */
  private generateDetailedReleaseNotes(
    config: TagConfig,
    tag: string,
    commits: CommitInfo[]
  ): string {
    const lines = [
      `# 🚀 SalamBot Release ${tag}`,
      '',
      `**📅 Date de Release:** ${new Date().toLocaleDateString('fr-FR')}`,
      `**🏷️ Version:** ${config.version}`,
      `**📋 Type:** ${config.type.toUpperCase()}`,
      '',
      '## 📝 Description',
      '',
      config.description,
      ''
    ];

    // Fonctionnalités
    if (config.features.length > 0) {
      lines.push('## ✨ Nouvelles Fonctionnalités');
      lines.push('');
      config.features.forEach(feature => {
        lines.push(`- ${feature}`);
      });
      lines.push('');
    }

    // Métriques
    if (config.metrics) {
      lines.push('## 📊 Métriques de Performance');
      lines.push('');
      lines.push('| Métrique | Valeur |');
      lines.push('|----------|--------|');
      Object.entries(config.metrics).forEach(([key, value]) => {
        lines.push(`| ${this.formatMetricName(key)} | ${value} |`);
      });
      lines.push('');
    }

    // Détails techniques
    lines.push('## 🔧 Détails Techniques');
    lines.push('');
    lines.push('### Commits Inclus');
    lines.push('');
    commits.forEach(commit => {
      lines.push(`- \`${commit.hash}\` ${commit.message} (${commit.author})`);
    });
    lines.push('');

    // Footer
    lines.push('---');
    lines.push('');
    lines.push('**🤖 Généré automatiquement par SalamBot Intelligent Tagging System v2.2**');
    lines.push('**📧 Contact:** info@salambot.ma');
    lines.push('**🌐 Site vitrine:** https://salambot.ma');
lines.push('**🚀 Application:** https://salambot.app');

    return lines.join('\n');
  }

  /**
   * 📊 Collecte et affichage des métriques
   */
  private async collectAndDisplayMetrics(config: TagConfig): Promise<void> {
    console.log('');
    console.log('📊 Métriques de Release:');
    console.log('========================');
    
    if (config.metrics) {
      Object.entries(config.metrics).forEach(([key, value]) => {
        const emoji = this.getMetricEmoji(key);
        console.log(`${emoji} ${this.formatMetricName(key)}: ${value}`);
      });
    }
    
    console.log(`🏷️ Tag: ${this.generateHybridTag(config)}`);
    console.log(`📦 Version: ${config.version}`);
    console.log(`🎯 Type: ${config.type.toUpperCase()}`);
    console.log('');
  }

  /**
   * ✅ Validation de l'environnement
   */
  private async validateEnvironment(): Promise<void> {
    // Vérification Git
    try {
      execSync('git status', { stdio: 'pipe' });
    } catch {
      throw new Error('❌ Dépôt Git non initialisé');
    }

    // Vérification package.json
    if (!fs.existsSync(this.packageJsonPath)) {
      throw new Error('❌ package.json introuvable');
    }

    console.log('✅ Environnement validé');
  }

  /**
   * 📋 Génération du CHANGELOG initial
   */
  private generateInitialChangelog(): string {
    return `# Changelog SalamBot

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [Unreleased]

`;
  }
}

// 🎯 Configurations prédéfinies selon la stratégie optimale
const PREDEFINED_CONFIGS: Record<string, Partial<TagConfig>> = {
  'phase1-darija': {
    businessSuffix: 'darija-optimization',
    phase: 'phase1',
    description: 'Phase 1 - Optimisation Détection Darija avec performances avancées',
    features: [
      'Détection Darija bi-script (Latin/Arabe) optimisée',
      'Cache LRU intelligent pour performances',
      'Seuils adaptatifs selon le contexte',
      'Métriques temps-réel et monitoring'
    ],
    metrics: {
      precision: '100%',
      responseTime: '2.4ms',
      coverage: '100%'
    }
  },
  
  'phase2-qadi': {
    businessSuffix: 'qadi-integration',
    phase: 'phase2',
    description: 'Phase 2 - Intégration Dataset QADI et modèles ML avancés',
    features: [
      'Intégration complète dataset QADI',
      'Modèles ML/AI spécialisés Darija',
      'API Gateway avec fallback intelligent',
      'Scaling production et monitoring avancé'
    ]
  },
  
  'hotfix-critical': {
    businessSuffix: 'critical-fix',
    phase: 'hotfix',
    description: 'Correction critique de sécurité ou performance',
    features: ['Correction critique appliquée']
  }
};

// 🚀 Interface CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const tagger = new IntelligentTagger();
  
  switch (command) {
    case 'phase1':
      tagger.createIntelligentTag({
        version: '2.2.0',
        type: 'minor',
        ...PREDEFINED_CONFIGS['phase1-darija']
      } as TagConfig);
      break;
      
    case 'phase2':
      tagger.createIntelligentTag({
        version: '2.3.0',
        type: 'minor',
        ...PREDEFINED_CONFIGS['phase2-qadi']
      } as TagConfig);
      break;
      
    case 'hotfix':
      const version = args[1] || '2.2.1';
      tagger.createIntelligentTag({
        version,
        type: 'patch',
        ...PREDEFINED_CONFIGS['hotfix-critical']
      } as TagConfig);
      break;
      
    case 'custom':
      // Configuration personnalisée via arguments
      const customConfig: TagConfig = {
        version: args[1] || '2.2.0',
        type: (args[2] as TagConfig['type']) || 'minor',
        description: args[3] || 'Release personnalisée',
        features: args.slice(4) || ['Fonctionnalité personnalisée']
      };
      tagger.createIntelligentTag(customConfig);
      break;
      
    default:
      console.log('🤖 SalamBot Intelligent Tagging System v2.2');
      console.log('');
      console.log('Usage:');
      console.log('  npm run tag:phase1     - Tag Phase 1 Darija');
      console.log('  npm run tag:phase2     - Tag Phase 2 QADI');
      console.log('  npm run tag:hotfix [version] - Tag Hotfix');
      console.log('  npm run tag:custom [version] [type] [description] [features...] - Tag personnalisé');
      console.log('');
      console.log('Exemples:');
      console.log('  npm run tag:phase1');
      console.log('  npm run tag:hotfix 2.2.1');
      console.log('  npm run tag:custom 2.3.0 minor "Nouvelle fonctionnalité" "Feature A" "Feature B"');
      break;
  }
}

export { IntelligentTagger, TagConfig, PREDEFINED_CONFIGS };