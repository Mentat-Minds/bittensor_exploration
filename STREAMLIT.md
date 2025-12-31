# 🎨 Bittensor Alpha Holders Dashboard

Dashboard interactif Streamlit pour analyser les détenteurs d'alpha tokens Bittensor.

## 📊 Fonctionnalités

### Vue d'Ensemble Globale
- **Total Coldkeys**: Nombre total de wallets avec > 0.1 TAO d'alpha
- **Total Alpha**: Valeur totale d'alpha tokens détenus
- **Total Portefeuille**: Valeur totale de tous les portefeuilles
- **% Alpha Moyen**: Pourcentage moyen d'alpha dans les portefeuilles

### Répartition par Catégorie
- **Nombre de coldkeys** par catégorie (Subnet Owner, Validator, Miner, Investor)
- **Valeur en TAO** par catégorie

### Analyses Détaillées (Par Catégorie)

Pour chaque catégorie (Subnet Owner, Validator, Miner, Investor, ou Tous), le dashboard affiche :

#### 1. **Répartition par Nombre d'Alpha Tokens Différents**
- Tranches : 1 token | 2-5 tokens | 6-10 tokens | 10+ tokens
- Vue par nombre de coldkeys
- Vue par valeur TAO

#### 2. **Répartition par % Alpha dans le Portefeuille**
- Tranches : 0-25% | 25-50% | 50-75% | 75-100%
- Vue par nombre de coldkeys
- Vue par valeur TAO

#### 3. **Répartition par Montant Total du Portefeuille**
- Tranches : < 10 TAO | 10-100 TAO | 100-1K TAO | 1K-10K TAO | 10K+ TAO
- Vue par nombre de coldkeys
- Vue par valeur TAO

#### 4. **Répartition par Nombre de Transactions**
- Tranches : 0 tx | 1-10 tx | 10-50 tx | 50-100 tx | 100+ tx
- Vue par nombre de coldkeys
- Vue par valeur TAO

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
pip install -r requirements-streamlit.txt
```

### 2. Vérifier que les données sont présentes

Le dashboard utilise le fichier :
```
output/alpha_holders_analysis_with_roles.json
```

Assurez-vous que ce fichier existe (il est généré par l'analyse complète).

---

## 📱 Lancer le Dashboard

### Commande simple

```bash
streamlit run streamlit_app.py
```

### Options avancées

```bash
# Spécifier un port
streamlit run streamlit_app.py --server.port 8502

# Ouvrir automatiquement le navigateur
streamlit run streamlit_app.py --server.headless false

# Mode développement (auto-refresh)
streamlit run streamlit_app.py --server.runOnSave true
```

Le dashboard sera accessible à l'adresse :
```
http://localhost:8501
```

---

## 🎯 Utilisation

### Navigation

1. **Sidebar (gauche)** : Sélectionner une catégorie à analyser
   - Tous
   - Subnet Owner
   - Validator
   - Miner
   - Investor

2. **Vue principale** : Les graphiques se mettent à jour automatiquement selon la catégorie sélectionnée

### Types de Graphiques

- **📊 Barres** : Comparaisons entre tranches
- **🥧 Pie Charts** : Répartitions en pourcentage
- **📈 Métriques** : KPIs clés

### Interactivité

- **Hover** : Survoler les graphiques pour voir les détails
- **Zoom** : Cliquer-glisser pour zoomer
- **Légende** : Cliquer pour masquer/afficher des catégories
- **Export** : Bouton 📷 en haut à droite de chaque graphique

---

## 📁 Structure des Données

Le dashboard attend un fichier JSON avec la structure suivante :

```json
[
  {
    "coldkey": "5ABC...",
    "roles": ["Miner", "Validator"],
    "total_alpha_value_tao": 123.45,
    "unique_alpha_tokens": 5,
    "total_wallet_value_tao": 150.00,
    "alpha_percentage": 82.3,
    "number_tx": 42,
    ...
  }
]
```

---

## 🛠️ Personnalisation

### Modifier les Tranches

Éditer les fonctions de catégorisation dans `streamlit_app.py` :

```python
def categorize_token_count(count: int) -> str:
    # Modifier les tranches ici
    ...

def categorize_wallet_value(value: float) -> str:
    # Modifier les tranches ici
    ...
```

### Changer les Couleurs

Modifier les `color_discrete_map` dans les graphiques :

```python
color_discrete_map={
    'Subnet Owner': '#FF6B6B',  # Rouge
    'Validator': '#4ECDC4',      # Turquoise
    'Miner': '#45B7D1',          # Bleu
    'Investor': '#FFA07A'        # Orange
}
```

---

## ⚡ Performance

- **Temps de chargement** : ~1-2 secondes pour 15,000+ wallets
- **Cache** : Les données sont mises en cache avec `@st.cache_data`
- **Mémoire** : ~100-200 MB pour le dataset complet

---

## 🐛 Troubleshooting

### Le dashboard ne démarre pas

```bash
# Vérifier que Streamlit est installé
pip list | grep streamlit

# Réinstaller si nécessaire
pip install -r requirements-streamlit.txt --force-reinstall
```

### Fichier de données non trouvé

```bash
# Vérifier que le fichier existe
ls -lh output/alpha_holders_analysis_with_roles.json

# Si manquant, relancer l'analyse
npm run add:roles
```

### Port déjà utilisé

```bash
# Utiliser un autre port
streamlit run streamlit_app.py --server.port 8502
```

---

## 📝 Notes

- Le dashboard se rafraîchit automatiquement quand le fichier de données change
- Les graphiques sont entièrement interactifs (zoom, pan, export)
- Optimisé pour desktop et mobile
- Mode sombre disponible via les paramètres Streamlit (⚙️)

---

## 🚀 Prochaines Étapes

Après avoir lancé le dashboard et vérifié que tout fonctionne :

1. ✅ Vérifier les métriques globales
2. ✅ Explorer chaque catégorie
3. ✅ Identifier les insights clés
4. 📊 Prendre des screenshots pour reporting
5. 🔄 Relancer l'analyse avec les nouvelles fixes (subnets 0-128)

---

**Créé pour l'analyse des alpha holders Bittensor** 🔗
