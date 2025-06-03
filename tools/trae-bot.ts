#!/usr/bin/env ts-node
import { execSync } from 'node:child_process';

const GH = (cmd: string) =>
  execSync(`gh ${cmd}`, {
    stdio: 'inherit',
    shell:
      process.platform === 'win32'
        ? process.env.ComSpec || 'cmd.exe'
        : '/bin/bash',
  });

/* -------------------------------------------------------------------------- */
/*                                1.  PR setup                                */
/* -------------------------------------------------------------------------- */
function openSetupPR() {
  const branch = 'feature/trae-bot-setup';

  // Définit le dépôt GitHub par défaut (utile si plusieurs repos)
  const remote = execSync('git remote get-url origin').toString().trim();
  GH(`repo set-default "${remote}"`);

  /* ----- création de la branche ou checkout si elle existe déjà ---------- */
  try {
    execSync(`git checkout -b ${branch}`);
  } catch {
    execSync(`git checkout ${branch}`);
  }

  /* ----- ajoute le script + workflow au commit initial ------------------- */
  execSync('git add tools/trae-bot.ts .github/workflows/trae.yml');
  try {
    execSync('git commit -m "chore(bot): initial Trae-Bot automation"');
  } catch {
    // commit already exists – silence is golden
  }
  execSync(`git push -u origin ${branch}`);

  /* ----- ouvre la Pull Request ------------------------------------------ */
  try {
    GH('pr view'); // si PR existe déjà, pas d’exception
  } catch {
    GH('pr create --fill --label phase-2,priority-high --reviewer oarib');
  }
}

/* -------------------------------------------------------------------------- */
/*                             2.  Issues Phase 2                             */
/* -------------------------------------------------------------------------- */
const issues = [
  {
    title: 'feat(core): UnifiedAIService + providerPolicy',
    assignee: 'oarib',
    body: 'Implémenter le service IA unifié selon TODO.md.',
    labels: 'phase-2,priority-high,core',
  },
  {
    title: 'feat(connectors): WhatsApp Cloud Sandbox',
    assignee: 'oarib',
    body: 'Intégrer WhatsApp Business Cloud API.',
    labels: 'phase-2,priority-high,connectors',
  },
  {
    title: 'feat(payment): Stripe + CMI Integration',
    assignee: 'oarib',
    body: 'Module payment abstrait + Stripe + CMI.',
    labels: 'phase-2,priority-high,payment',
  },
  {
    title: 'docs: Pricing Strategy',
    assignee: 'oarib',
    body: 'Rédiger docs/pricing.md avec la nouvelle grille.',
    labels: 'phase-2,priority-high,documentation',
  },
  {
    title: 'infra: Redis Cache Module',
    assignee: 'devops',
    body: 'Module Terraform pour Redis cache.',
    labels: 'phase-2,priority-high,infrastructure',
  },
];

function createPhase2Issues() {
  issues.forEach(({ title, assignee, body, labels }) => {
    GH(
      `issue create --title "${title}" --body "${body}" --assignee "${assignee}" --label "${labels}"`
    );
  });
}

/* -------------------------------------------------------------------------- */
/*                                3.  CLI                                     */
/* -------------------------------------------------------------------------- */
const arg = process.argv[2];

switch (arg) {
  case 'init':
    openSetupPR();
    createPhase2Issues();
    console.log('\n✅ Pull Request et issues Phase 2 créées');
    break;
  case 'issues':
    createPhase2Issues();
    console.log('\n✅ Issues Phase 2 créées (sans PR)');
    break;
  default:
    console.log(
      'Usage :\n  pnpm bot:init           # PR + issues\n  pnpm bot:init issues    # issues seules'
    );
}
