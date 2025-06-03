# Datasets de Validation - Détection Darija Bi-Script

Ce dossier contient les datasets utilisés pour valider et tester la précision de la détection Darija bi-script.

## Structure

```
datasets/
├── README.md                    # Ce fichier
├── IADD/                        # Dataset IADD (Integrated Arabic Dialect Identification)
│   ├── IADD.json               # 136,000+ textes dialectes arabes
│   └── README.md               # Documentation IADD
├── QADI/                        # Dataset QADI (QCRI Arabic Dialect Identification)
│   ├── dataset/                # IDs d'entraînement par pays
│   │   └── QADI_train_ids_MA.txt  # 12,813 IDs tweets marocains
│   └── testset/                # Données de test
│       └── QADI_test.txt       # 3,503 échantillons (178 marocains)
├── analyze-iadd.ps1            # Script d'analyse IADD
├── analyze-qadi-morocco.ps1    # Script d'analyse QADI Maroc
└── check-morocco.ps1           # Script vérification données marocaines
```

## Datasets Disponibles

### 1. IADD (Integrated Arabic Dialect Identification) ✅ CLONÉ
- **Source**: https://github.com/UBC-NLP/IADD
- **Taille**: 136,000+ textes de 5 régions, 9 pays
- **Maghrebi (MGH)**: 33,996 entrées (Algérie: 14,426, Tunisie: 11,998, Maroc: 7,213)
- **Format**: JSON avec clés Sentence, Region, Country, DataSource
- **Scripts**: Principalement arabe, quelques échantillons bi-script
- **Statut**: ⚠️ Données marocaines limitées (7,213 sur 136K)

### 2. QADI (QCRI Arabic Dialect Identification) ✅ CLONÉ
- **Source**: https://github.com/qcri/QADI
- **Taille**: 540,590 tweets de 18 pays arabes
- **Maroc (MA)**: 
  - 12,813 IDs d'entraînement (nécessitent hydratation Twitter)
  - 178 échantillons de test prêts à utiliser
- **Format**: TSV (Texte\tCode_Pays)
- **Scripts**: Darija en arabe (85.4%) et latin (12.9%), bi-script (1.7%)
- **Statut**: ✅ Excellent pour validation Darija

## Analyse des Données Marocaines

### QADI - Échantillons de Test (178 échantillons)
- **Arabe uniquement**: 85.4% (152 échantillons)
- **Latin uniquement**: 12.9% (23 échantillons)
- **Bi-script**: 1.7% (3 échantillons)
- **Qualité**: Authentique Darija marocain

### Exemples Darija QADI
```
# Darija Arabe
اش كتعمل فهاد الوقت ؟
واش نتا مزيان ؟

# Darija Latin
wach nta mezyan?
ash katdir?

# Bi-script
salam alikom كيف الحال ?
```

## Instructions d'Utilisation

### Datasets Déjà Clonés
```bash
# Les datasets sont déjà disponibles dans:
./IADD/IADD.json
./QADI/testset/QADI_test.txt
./QADI/dataset/QADI_train_ids_MA.txt
```

### Scripts d'Analyse
```powershell
# Analyser IADD
.\analyze-iadd.ps1

# Analyser données marocaines QADI
.\analyze-qadi-morocco.ps1

# Vérifier données marocaines
.\check-morocco.ps1
```

### Traitement pour Tests
1. **QADI Test**: Utiliser directement les 178 échantillons marocains
2. **IADD Maghrebi**: Filtrer Region="MGH" pour données supplémentaires
3. **Format Cible**: Convertir en format JSON pour tests automatisés

## Recommandations d'Implémentation

### Phase 1: QADI (Priorité Haute)
- ✅ Dataset cloné et analysé
- 178 échantillons de test prêts
- Couverture bi-script authentique
- **Action**: Intégrer dans pipeline de tests

### Phase 2: IADD (Complément)
- ✅ Dataset cloné
- 33,996 échantillons Maghrebi disponibles
- **Action**: Filtrer et enrichir dataset de validation

### Phase 3: Hydratation Twitter (Optionnel)
- 12,813 IDs tweets marocains QADI
- **Outils**: twarc, tweepy
- **Action**: Expansion dataset si nécessaire

## Objectifs de Validation P0

- **Précision Globale**: >88%
- **Darija Latin**: >90%
- **Darija Arabe**: >85%
- **Temps de Réponse**: <100ms
- **Couverture Tests**: >85%

## Statut Actuel

✅ **QADI**: Prêt pour intégration  
✅ **IADD**: Disponible pour enrichissement  
⏳ **Prochaine étape**: Créer scripts de conversion et intégration dans tests