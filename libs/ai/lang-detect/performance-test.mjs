/**
 * 🚀 Test de Performance - Phase 1 Optimizations
 * 
 * Script pour mesurer l'impact des optimisations Phase 1:
 * - Dictionnaire Darija étendu (+150%)
 * - Patterns de code-switching étendus (+200%)
 * - Expressions idiomatiques étendues (+300%)
 * - Cache LRU implémenté
 * - Seuils optimisés
 */

import { detectLanguage } from './src/lib/ai-lang-detect.ts';

// Échantillons de test Darija variés
const testSamples = [
  // Darija Latin
  'salam khouya, kifach nta?',
  'wach nta mezyan? ana bikhir hamdullah',
  'ghadi nmchi l souk daba',
  'hadi chi haja zwina bezaf',
  'ma3lich, machi mouchkil',
  
  // Darija Arabe
  'السلام عليكم، كيف راك؟',
  'واش نتا مزيان؟ أنا بخير الحمد لله',
  'غادي نمشي للسوق دابا',
  'هادي شي حاجة زوينة بزاف',
  'معليش، ماشي مشكيل',
  
  // Code-switching (nouvelles expressions ajoutées)
  'salam كيف الحال?',
  'ana fine, و نتا?',
  'ghadi نروح للmaison',
  'hadi une belle journée',
  'merci بزاف خويا',
  
  // Expressions idiomatiques (nouvelles ajoutées)
  'lla ykhalik',
  'allah y3tik saha',
  'bsaha w raha',
  'makain mouchkil',
  'nchallah ghadi ykoun bikhir',
  
  // Expressions temporelles (nouvelles)
  'daba hadi',
  'ghda nchallah',
  'lbara7 kunt',
  'f had lwaqt',
  'mn ba3d chwiya',
  
  // Nourriture/vie quotidienne (nouvelles)
  'ghadi ndir tajine',
  'bghit natay atay',
  'khubz w zit',
  'lham w khodra',
  'couscous b lham',
  
  // Famille/relations (nouvelles)
  'mama w baba',
  'khouya w khti',
  'wladi sghar',
  'jdati zwina',
  '3ammi karim',
  
  // Émotions/états (nouvelles)
  'ana far7an bezaf',
  'makainch bass',
  'nta za3fan?',
  'ana khayfa chwiya',
  'hani mabsout',
  
  // Transport/lieux (nouvelles)
  'taxi wla tram?',
  'gare routière',
  'l7ay l9dim',
  'centre ville',
  'dar dyalna',
  
  // Interjections (nouvelles)
  'yallah sir',
  'aji hna',
  'wili wili',
  'ay ay ay',
  'bismillah',
  
  // Négations (nouvelles)
  'ma bghitchi',
  'ma3raftchi',
  'ma kaynchi',
  'ma qadartchi',
  'ma fahmatchi'
];

// Fonction de test de performance
async function runPerformanceTest() {
  console.log('🚀 Test de Performance - Phase 1 Optimizations');
  console.log('=' .repeat(60));
  
  const results = {
    totalSamples: testSamples.length,
    correctDetections: 0,
    totalTime: 0,
    averageTime: 0,
    minTime: Infinity,
    maxTime: 0,
    cacheHits: 0,
    confidenceSum: 0,
    averageConfidence: 0,
    scriptBreakdown: {
      latin: 0,
      arabic: 0,
      biScript: 0
    },
    detectionBreakdown: {
      darija: 0,
      arabic: 0,
      unknown: 0,
      other: 0
    }
  };
  
  console.log(`📊 Testing ${testSamples.length} échantillons Darija...\n`);
  
  // Premier passage - mesure de performance
  for (let i = 0; i < testSamples.length; i++) {
    const sample = testSamples[i];
    const startTime = performance.now();
    
    try {
      const result = await detectLanguage(sample);
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Statistiques de temps
      results.totalTime += processingTime;
      results.minTime = Math.min(results.minTime, processingTime);
      results.maxTime = Math.max(results.maxTime, processingTime);
      
      // Statistiques de détection
      if (result.language === 'darija' || result.language === 'arabic') {
        results.correctDetections++;
      }
      
      results.confidenceSum += result.confidence;
      
      // Breakdown par script
      if (result.script === 'latin') results.scriptBreakdown.latin++;
      else if (result.script === 'arabic') results.scriptBreakdown.arabic++;
      else if (result.script === 'bi-script') results.scriptBreakdown.biScript++;
      
      // Breakdown par langue détectée
      if (result.language === 'darija') results.detectionBreakdown.darija++;
      else if (result.language === 'arabic') results.detectionBreakdown.arabic++;
      else if (result.language === 'unknown') results.detectionBreakdown.unknown++;
      else results.detectionBreakdown.other++;
      
      console.log(`${(i + 1).toString().padStart(2)}. "${sample}" → ${result.language} (${result.script}) [${processingTime.toFixed(1)}ms, ${(result.confidence * 100).toFixed(1)}%]`);
      
    } catch (error) {
      console.error(`❌ Erreur pour "${sample}": ${error.message}`);
    }
  }
  
  // Deuxième passage - test du cache
  console.log('\n🔄 Test du cache (re-exécution des mêmes échantillons)...');
  const cacheTestStart = performance.now();
  
  for (const sample of testSamples.slice(0, 10)) {
    const startTime = performance.now();
    await detectLanguage(sample);
    const endTime = performance.now();
    
    if ((endTime - startTime) < 1) { // Très rapide = probablement du cache
      results.cacheHits++;
    }
  }
  
  const cacheTestEnd = performance.now();
  const cacheTestTime = cacheTestEnd - cacheTestStart;
  
  // Calculs finaux
  results.averageTime = results.totalTime / results.totalSamples;
  results.averageConfidence = results.confidenceSum / results.totalSamples;
  const accuracy = (results.correctDetections / results.totalSamples) * 100;
  
  // Affichage des résultats
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RÉSULTATS DE PERFORMANCE - PHASE 1');
  console.log('=' .repeat(60));
  
  console.log(`\n🎯 Métriques de Précision:`);
  console.log(`   Détections correctes: ${results.correctDetections}/${results.totalSamples}`);
  console.log(`   Précision globale: ${accuracy.toFixed(1)}% (Objectif: >88%)`);
  console.log(`   Confiance moyenne: ${(results.averageConfidence * 100).toFixed(1)}%`);
  
  console.log(`\n⚡ Métriques de Performance:`);
  console.log(`   Temps moyen: ${results.averageTime.toFixed(1)}ms (Objectif: <100ms)`);
  console.log(`   Temps min: ${results.minTime.toFixed(1)}ms`);
  console.log(`   Temps max: ${results.maxTime.toFixed(1)}ms`);
  console.log(`   Temps total: ${results.totalTime.toFixed(1)}ms`);
  
  console.log(`\n💾 Métriques de Cache:`);
  console.log(`   Hits de cache détectés: ${results.cacheHits}/10`);
  console.log(`   Temps re-exécution: ${cacheTestTime.toFixed(1)}ms`);
  console.log(`   Amélioration cache: ${((results.averageTime * 10 - cacheTestTime) / (results.averageTime * 10) * 100).toFixed(1)}%`);
  
  console.log(`\n📝 Breakdown par Script:`);
  console.log(`   Latin: ${results.scriptBreakdown.latin} (${(results.scriptBreakdown.latin/results.totalSamples*100).toFixed(1)}%)`);
  console.log(`   Arabe: ${results.scriptBreakdown.arabic} (${(results.scriptBreakdown.arabic/results.totalSamples*100).toFixed(1)}%)`);
  console.log(`   Bi-script: ${results.scriptBreakdown.biScript} (${(results.scriptBreakdown.biScript/results.totalSamples*100).toFixed(1)}%)`);
  
  console.log(`\n🔍 Breakdown par Détection:`);
  console.log(`   Darija: ${results.detectionBreakdown.darija} (${(results.detectionBreakdown.darija/results.totalSamples*100).toFixed(1)}%)`);
  console.log(`   Arabe: ${results.detectionBreakdown.arabic} (${(results.detectionBreakdown.arabic/results.totalSamples*100).toFixed(1)}%)`);
  console.log(`   Inconnu: ${results.detectionBreakdown.unknown} (${(results.detectionBreakdown.unknown/results.totalSamples*100).toFixed(1)}%)`);
  console.log(`   Autre: ${results.detectionBreakdown.other} (${(results.detectionBreakdown.other/results.totalSamples*100).toFixed(1)}%)`);
  
  // Évaluation des objectifs
  console.log(`\n✅ ÉVALUATION DES OBJECTIFS:`);
  console.log(`   Précision globale: ${accuracy >= 88 ? '✅' : '❌'} ${accuracy.toFixed(1)}% (>88%)`);
  console.log(`   Temps de réponse: ${results.averageTime < 100 ? '✅' : '❌'} ${results.averageTime.toFixed(1)}ms (<100ms)`);
  console.log(`   Cache fonctionnel: ${results.cacheHits > 0 ? '✅' : '❌'} ${results.cacheHits} hits détectés`);
  
  const objectivesMet = accuracy >= 88 && results.averageTime < 100 && results.cacheHits > 0;
  console.log(`\n🎯 PHASE 1 STATUS: ${objectivesMet ? '✅ SUCCÈS' : '⚠️ EN COURS'}`);
  
  if (objectivesMet) {
    console.log('\n🚀 Les optimisations Phase 1 ont atteint les objectifs!');
    console.log('   Prêt pour Phase 2: Expansion dataset QADI');
  } else {
    console.log('\n⚠️ Optimisations supplémentaires nécessaires');
    if (accuracy < 88) console.log('   - Améliorer la précision (ajouter plus de mots-clés)');
    if (results.averageTime >= 100) console.log('   - Optimiser les performances (cache, algorithmes)');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Exécution du test
runPerformanceTest().catch(console.error);