# 🎯 Ajouter les Rôles aux Données Existantes

Ce script ajoute les classifications de wallet (Subnet Owner, Validator, Miner) au JSON existant **SANS relancer toute l'analyse** (qui prendrait 16h).

## ⏱️ Durée Estimée : 5-10 minutes

---

## 🚀 Comment Utiliser

### Option 1 : Commande Simple

```bash
npm run add:roles
```

### Option 2 : Commande Complète

```bash
npm run build && node dist/scripts/addRolesToExistingData.js
```

---

## 📋 Ce Que Fait le Script

1. **Lit** le JSON existant (`output/alpha_holders_analysis.json`)
2. **Fetch** les metagraphs pour tous les subnets (~5 min)
3. **Classifie** les 15,323 coldkeys
4. **Merge** les rôles dans les données existantes
5. **Sauvegarde** 2 fichiers :
   - `alpha_holders_analysis_with_roles.json` (nouveau, avec rôles)
   - `alpha_holders_analysis_backup.json` (backup de l'original)

---

## ✅ Sécurité

- ❌ **NE MODIFIE PAS** le fichier original
- ✅ Crée un **nouveau fichier** avec rôles
- ✅ Crée un **backup** de l'original
- ✅ **Aucun risque** de perdre les données

---

## 📊 Ce Qui Change

### Avant
```json
{
  "coldkey": "5H3in...",
  "roles": ["Investor"],  ← Tous par défaut
  ...
}
```

### Après
```json
{
  "coldkey": "5H3in...",
  "roles": ["Subnet Owner", "Validator"],  ← Rôles réels !
  ...
}
```

---

## 🎯 Résultat Attendu

```
=== Adding Roles to Existing Analysis Data ===

Step 1: Reading existing data...
  ✓ Loaded 15,323 holders

Step 2: Fetching metagraphs for wallet classification...
  (This will take ~5-10 minutes)

=== Fetching metagraphs for 64 subnets ===
  ✓ Fetched 10/64 subnets...
  ...
  ✓ Completed: 64/64 subnets fetched
  Total neurons found: 16,384

Step 3: Classifying coldkeys...
  ✓ Classified 12,456 coldkeys

Step 4: Merging roles...
  ✓ Updated: 12,456 holders
  ✓ Unchanged: 2,867 holders

Step 5: New role distribution:
  - Miner: 10,234
  - Validator: 1,823
  - Subnet Owner: 234
  - Investor: 2,867
  - Miner / Validator: 165

Step 6: Saving files...
  ✓ Backup saved: output/alpha_holders_analysis_backup.json
  ✓ Updated data saved: output/alpha_holders_analysis_with_roles.json
  ✓ File size: 19.5 MB

✅ ROLES SUCCESSFULLY ADDED!
```

---

## 📁 Fichiers Créés

```
output/
├── alpha_holders_analysis.json              ← Original (inchangé)
├── alpha_holders_analysis_backup.json       ← Backup
└── alpha_holders_analysis_with_roles.json   ← Nouveau avec rôles ✨
```

---

## 💡 Après le Script

Tu peux utiliser le nouveau fichier pour ton dashboard Streamlit :

```python
import json
import pandas as pd

# Charger les données avec rôles
with open('output/alpha_holders_analysis_with_roles.json') as f:
    data = json.load(f)

df = pd.DataFrame(data)

# Maintenant tu as les vrais rôles !
print(df['roles'].explode().value_counts())
```

---

## ⚠️ Si Ça Plante

Le script original reste **intact** dans `alpha_holders_analysis.json`.

Tu peux toujours relancer :
```bash
npm run add:roles
```

---

## 🔄 Comparaison Rapide

| Méthode | Durée | Risque | Résultat |
|---------|-------|--------|----------|
| **Re-run complet** | 16h | Faible | Tout refait |
| **Add roles script** | 5-10 min | Aucun | Juste les rôles |

**Recommandé : Add roles script** ✅

---

## 🚀 Lets Go !

```bash
npm run add:roles
```

Et dans 5-10 minutes, tu auras tous les rôles ! 🎉
