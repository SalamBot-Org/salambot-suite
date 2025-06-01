#!/usr/bin/env ts-node
/**
 * Trae-Bot helper – crée issues & PR via la CLI GitHub.
 * Usage :
 *   pnpm bot:init             -> ouvre la PR setup + 5 issues Phase-2
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const GH = (cmd: string) => execSync(`gh ${cmd}`, { stdio: 'inherit', shell: true }); // <= garde compatibilité cmd/ps

/* ---------- 1. ouverture de la PR setup ---------- */
function openSetupPR() {
    const branch = 'feature/trae-bot-setup';
    
  // Définit le dépôt par défaut sans la substitution bash
  const remote = execSync('git remote get-url origin').toString().trim();
  GH(`repo set-default "${remote}"`);
  execSync(`git checkout -b ${branch}`);
  execSync('git add tools/trae-bot.ts .github/workflows/trae.yml');
  execSync(`git commit -m "chore(bot): initial Trae-Bot automation"`);
  execSync(`git push -u origin ${branch}`);
  // ouvre PR
  GH(`pr create --fill --label phase-2,priority-high --reviewer oarib`);
}

/* ---------- 2. création des issues Phase-2 ---------- */
const issues = [
  {
    title: 'feat(core): UnifiedAIService + providerPolicy',
    assignee: 'Trae-Bot',
    body: 'Implémenter le service IA unifié selon TODO.md.',
    labels: 'phase-2,priority-high,core'
  },
  {
    title: 'feat(connectors): WhatsApp Cloud Sandbox',
    assignee: 'Trae-Bot',
    body: 'Intégrer WhatsApp Business Cloud API.',
    labels: 'phase-2,priority-high,connectors'
  },
  {
    title: 'feat(payment): Stripe + CMI Integration',
    assignee: 'Trae-Bot',
    body: 'Module payment abstrait + Stripe + CMI.',
    labels: 'phase-2,priority-high,payment'
  },
  {
    title: 'docs: Pricing Strategy',
    assignee: 'oarib',
    body: 'Rédiger docs/pricing.md avec la nouvelle grille.',
    labels: 'phase-2,priority-high,documentation'
  },
  {
    title: 'infra: Redis Cache Module',
    assignee: 'devops',
    body: 'Module Terraform pour Redis cache.',
    labels: 'phase-2,priority-high,infrastructure'
  }
];

function createPhase2Issues() {
  issues.forEach(({ title, assignee, body, labels }) => {
    GH(
      `issue create --title "${title}" --body "${body}" --assignee "${assignee}" --label "${labels}"`
    );
  });
}

/* ---------- Exécution ---------- */
const arg = process.argv[2];
if (arg === 'init') {
  openSetupPR();
  createPhase2Issues();
  console.log('✅ PR + issues Phase-2 créés');
} else {
  console.log('Usage: pnpm bot:init');
}
