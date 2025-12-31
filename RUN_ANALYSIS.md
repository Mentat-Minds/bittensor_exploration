# 🚀 Comment Lancer l'Analyse

## Option 1 : Lancement Normal (terminal doit rester ouvert)

```bash
./run_analysis.sh
```

**Durée estimée** : 9-12 heures

---

## Option 2 : Lancement en Background (recommandé pour la nuit)

```bash
./run_analysis_background.sh
```

L'analyse continue même si tu fermes le terminal ou ton Mac se met en veille.

### Suivre la Progression

```bash
# Voir les logs en temps réel
tail -f output/logs/nohup_*.out

# Ou check le dernier log
tail -f output/logs/analysis_run_*.log
```

### Vérifier si ça Tourne

```bash
# Voir les processus node
ps aux | grep node

# Ou check les logs récents
ls -lht output/logs/
```

### Arrêter l'Analyse

Si besoin d'arrêter :
```bash
# Trouve le PID
ps aux | grep "npm run analyze"

# Kill le process
kill <PID>
```

---

## 📊 Résultats

### Pendant l'Exécution

Les logs montreront :
- ✓ Step 1 completed in X.XX minutes
- ✓ Step 2 completed in X.XX minutes
- ...
- 🎉 ANALYSIS COMPLETE!

### Quand c'est Fini

**1. Récap Automatique**
```bash
cat output/ANALYSIS_RECAP.txt
```

Contient :
- ⏱️ Temps d'exécution total
- 🔍 Analyse des erreurs
- 📊 Résumé des résultats
- 📁 Info sur le fichier JSON

**2. JSON Complet**
```bash
ls -lh output/alpha_holders_analysis.json
```

**3. Logs Détaillés**
```bash
ls -lht output/logs/
```

---

## 🐛 En Cas de Problème

### L'analyse plante

1. Check le dernier log :
```bash
tail -100 output/logs/analysis_run_*.log
```

2. Regarde les erreurs :
```bash
grep -i error output/logs/analysis_run_*.log
```

### Rate Limiting

Si tu vois beaucoup de "429" ou "rate limit" :
- C'est normal, le script attend automatiquement
- Ça ralentit mais continue

### Connection Errors

Si beaucoup de "ECONNREFUSED" :
- Check ta connexion internet
- Vérifie que l'API key est valide dans `.env`

---

## 💡 Tips

1. **Lance la nuit** : Moins de risque d'interruption
2. **Garde ton Mac branché** : Évite qu'il s'éteigne
3. **Connection stable** : WiFi ou ethernet
4. **Check le récap le matin** : `cat output/ANALYSIS_RECAP.txt`

---

## 📅 Quand Tu Te Reconnectes

```bash
# 1. Check si c'est fini
cat output/ANALYSIS_RECAP.txt

# 2. Voir le JSON
ls -lh output/alpha_holders_analysis.json

# 3. Nombre de holders
grep -o "coldkey" output/alpha_holders_analysis.json | wc -l
```

**C'est tout ! 🎉**
