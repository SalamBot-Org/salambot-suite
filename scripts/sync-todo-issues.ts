#!/usr/bin/env ts-node

/**
 * Script de synchronisation TODO -> Issues GitHub
 * Implémente la stratégie d'alignement recommandée
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TodoTask {
  title: string;
  priority: 'P0' | 'P1' | 'P2';
  week: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  labels: string[];
}

interface GitHubIssue {
  title: string;
  body: string;
  labels: string[];
  milestone?: string;
}

class TodoIssueSync {
  private todoPath = path.join(process.cwd(), 'todo.md');
  private repoOwner = 'SalamBot-Org';
  private repoName = 'salambot-suite';

  /**
   * Parse le fichier TODO.md et extrait les tâches structurées
   */
  private parseTodoFile(): TodoTask[] {
    const todoContent = fs.readFileSync(this.todoPath, 'utf-8');
    const tasks: TodoTask[] = [];

    // Regex pour extraire les sections P0 et P1
    const prioritySections = todoContent.match(/## 🔥 PRIORITÉ P0[\s\S]*?(?=## 🚀 PRIORITÉ P1)|## 🚀 PRIORITÉ P1[\s\S]*?(?=## 📈 PRIORITÉ P2|$)/g);

    prioritySections?.forEach(section => {
      const priority = section.includes('P0') ? 'P0' : 'P1';
      
      // Extraire les sous-sections (ex: Détection Darija, API Gateway)
      const subsections = section.match(/### [^\n]+[\s\S]*?(?=###|$)/g);
      
      subsections?.forEach(subsection => {
        const titleMatch = subsection.match(/### (.+)/);
        if (!titleMatch) return;

        const title = titleMatch[1]
          .replace(/🎯|🌐|📊|🔐|📱|🛠️/g, '')
          .replace(/\[P0-CRITIQUE\]|\[P1-IMPORTANT\]/g, '')
          .trim();
        
        // Extraire les tâches individuelles
        const taskMatches = subsection.match(/- \[([ x])\] \*\*(.+?)\*\* : (.+)/g);
        
        taskMatches?.forEach(taskMatch => {
          const [, status, week, description] = taskMatch.match(/- \[([ x])\] \*\*(.+?)\*\* : (.+)/) || [];
          
          tasks.push({
            title: `[${priority}-${priority === 'P0' ? 'CRITIQUE' : 'IMPORTANT'}] ${title} - ${description}`,
            priority: priority as 'P0' | 'P1',
            week,
            description,
            status: status === 'x' ? 'done' : 'todo',
            labels: this.generateLabels(priority, title)
          });
        });
      });
    });

    return tasks;
  }

  /**
   * Génère les labels appropriés pour une tâche
   */
  private generateLabels(priority: string, title: string): string[] {
    const labels = [priority === 'P0' ? 'P0-CRITIQUE' : 'P1-IMPORTANT'];
    
    // Labels basés sur le contenu
    if (title.includes('Darija') || title.includes('AI')) labels.push('ai', 'nlp');
    if (title.includes('API') || title.includes('Gateway')) labels.push('backend', 'api');
    if (title.includes('Test') || title.includes('Coverage')) labels.push('testing', 'quality');
    if (title.includes('Auth') || title.includes('Sécurité')) labels.push('security', 'auth');
    if (title.includes('Infrastructure') || title.includes('Terraform')) labels.push('infrastructure', 'devops');
    if (title.includes('Widget') || title.includes('Agent')) labels.push('frontend', 'ui');
    if (title.includes('Documentation')) labels.push('documentation');
    
    return labels;
  }

  /**
   * Crée ou met à jour les milestones GitHub
   */
  private async createMilestones(): Promise<void> {
    const milestones = [
      { title: 'Semaine 1-2 (P0 Critique)', description: 'Tâches critiques à compléter en priorité absolue' },
      { title: 'Semaine 3-4 (P1 Important)', description: 'Tâches importantes pour la stabilité du projet' },
      { title: 'Semaine 5-6 (P2 Nice-to-have)', description: 'Améliorations et optimisations' }
    ];

    for (const milestone of milestones) {
      try {
        execSync(`gh api repos/${this.repoOwner}/${this.repoName}/milestones -f title="${milestone.title}" -f description="${milestone.description}"`, 
          { stdio: 'pipe' });
        console.log(`✅ Milestone créé: ${milestone.title}`);
      } catch (error) {
        console.log(`ℹ️  Milestone existe déjà: ${milestone.title}`);
      }
    }
  }

  /**
   * Crée les labels GitHub nécessaires
   */
  private async createLabels(): Promise<void> {
    const labels = [
      { name: 'P0-CRITIQUE', color: 'ff0000', description: 'Priorité critique - À traiter immédiatement' },
      { name: 'P1-IMPORTANT', color: 'ff8c00', description: 'Priorité importante - À traiter rapidement' },
      { name: 'P2-NICE-TO-HAVE', color: 'ffd700', description: 'Amélioration souhaitée' },
      { name: 'ai', color: '9932cc', description: 'Intelligence artificielle et NLP' },
      { name: 'nlp', color: '8a2be2', description: 'Natural Language Processing' },
      { name: 'backend', color: '008080', description: 'Développement backend' },
      { name: 'api', color: '20b2aa', description: 'API et services web' },
      { name: 'testing', color: '32cd32', description: 'Tests et qualité' },
      { name: 'quality', color: '228b22', description: 'Assurance qualité' },
      { name: 'security', color: 'dc143c', description: 'Sécurité et authentification' },
      { name: 'auth', color: 'b22222', description: 'Authentification' },
      { name: 'infrastructure', color: '4682b4', description: 'Infrastructure et DevOps' },
      { name: 'devops', color: '1e90ff', description: 'DevOps et CI/CD' },
      { name: 'frontend', color: 'ff69b4', description: 'Interface utilisateur' },
      { name: 'ui', color: 'ff1493', description: 'User Interface' },
      { name: 'documentation', color: '9370db', description: 'Documentation technique' }
    ];

    for (const label of labels) {
      try {
        execSync(`gh api repos/${this.repoOwner}/${this.repoName}/labels -f name="${label.name}" -f color="${label.color}" -f description="${label.description}"`, 
          { stdio: 'pipe' });
        console.log(`✅ Label créé: ${label.name}`);
      } catch (error) {
        console.log(`ℹ️  Label existe déjà: ${label.name}`);
      }
    }
  }

  /**
   * Crée une issue GitHub à partir d'une tâche TODO
   */
  private async createIssue(task: TodoTask): Promise<void> {
    const milestone = task.priority === 'P0' ? 'Semaine 1-2 (P0 Critique)' : 'Semaine 3-4 (P1 Important)';
    
    const body = `## 📋 Description

${task.description}

## 🎯 Objectifs

- [ ] Implémentation complète
- [ ] Tests unitaires
- [ ] Documentation mise à jour
- [ ] Review de code

## 📅 Planning

**Échéance:** ${task.week}
**Priorité:** ${task.priority}

## 🔗 Références

- Voir TODO.md pour les détails techniques
- Lié au milestone: ${milestone}

---

*Issue générée automatiquement depuis TODO.md*`;

    const labelsStr = task.labels.map(l => `"${l}"`).join(',');
    
    try {
      const result = execSync(
        `gh issue create --title "${task.title}" --body "${body}" --label ${labelsStr} --milestone "${milestone}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      console.log(`✅ Issue créée: ${task.title}`);
      console.log(`   URL: ${result.trim()}`);
    } catch (error) {
      console.error(`❌ Erreur création issue: ${task.title}`);
      console.error(error);
    }
  }

  /**
   * Vérifie si une issue existe déjà pour une tâche
   */
  private async issueExists(taskTitle: string): Promise<boolean> {
    try {
      const result = execSync(
        `gh issue list --search "${taskTitle}" --json title`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      const issues = JSON.parse(result);
      return issues.some((issue: any) => issue.title.includes(taskTitle.split(' - ')[0]));
    } catch (error) {
      return false;
    }
  }

  /**
   * Synchronise toutes les tâches TODO avec GitHub Issues
   */
  public async syncAll(): Promise<void> {
    console.log('🚀 Début de la synchronisation TODO -> Issues GitHub\n');

    // 1. Créer les labels et milestones
    console.log('📋 Création des labels...');
    await this.createLabels();
    
    console.log('\n🎯 Création des milestones...');
    await this.createMilestones();

    // 2. Parser le TODO
    console.log('\n📖 Analyse du fichier TODO.md...');
    const tasks = this.parseTodoFile();
    console.log(`   ${tasks.length} tâches trouvées`);

    // 3. Créer les issues
    console.log('\n🔄 Création des issues...');
    let created = 0;
    let skipped = 0;

    for (const task of tasks) {
      if (task.status === 'done') {
        console.log(`⏭️  Tâche terminée ignorée: ${task.title}`);
        skipped++;
        continue;
      }

      const exists = await this.issueExists(task.title);
      if (exists) {
        console.log(`⏭️  Issue existe déjà: ${task.title}`);
        skipped++;
        continue;
      }

      await this.createIssue(task);
      created++;
      
      // Pause pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Synchronisation terminée!`);
    console.log(`   📊 ${created} issues créées`);
    console.log(`   ⏭️  ${skipped} tâches ignorées`);
    console.log(`\n🔗 Voir toutes les issues: https://github.com/${this.repoOwner}/${this.repoName}/issues`);
  }

  /**
   * Mode dry-run pour prévisualiser les changements
   */
  public async dryRun(): Promise<void> {
    console.log('🔍 Mode dry-run - Prévisualisation des changements\n');
    
    const tasks = this.parseTodoFile();
    console.log(`📊 ${tasks.length} tâches trouvées dans TODO.md\n`);

    const p0Tasks = tasks.filter(t => t.priority === 'P0');
    const p1Tasks = tasks.filter(t => t.priority === 'P1');

    console.log(`🔥 Tâches P0 (${p0Tasks.length}):`);
    p0Tasks.forEach(task => {
      console.log(`   - ${task.title}`);
      console.log(`     Labels: ${task.labels.join(', ')}`);
    });

    console.log(`\n🚀 Tâches P1 (${p1Tasks.length}):`);
    p1Tasks.forEach(task => {
      console.log(`   - ${task.title}`);
      console.log(`     Labels: ${task.labels.join(', ')}`);
    });

    console.log(`\n💡 Pour exécuter la synchronisation: npm run sync-todo-issues`);
  }
}

// Exécution du script
if (require.main === module) {
  const sync = new TodoIssueSync();
  const isDryRun = process.argv.includes('--dry-run');
  
  if (isDryRun) {
    sync.dryRun().catch(console.error);
  } else {
    sync.syncAll().catch(console.error);
  }
}

export default TodoIssueSync;