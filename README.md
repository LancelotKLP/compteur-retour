# Compteur — Retour de Berlin

Web app + raccourci iOS pour compter les heures jusqu'au **30 juin 2026, 18 h 34** à Strasbourg.

---

## 1) Déployer la web app sur Vercel (le plus rapide)

```bash
cd /Users/maelkempf-lepape/Downloads/compteur-retour
npx vercel --prod
```

Suis les prompts (connexion, accepter les valeurs par défaut). Tu obtiens une URL du type `https://compteur-retour.vercel.app`.

**Alternative GitHub Pages :**
```bash
cd /Users/maelkempf-lepape/Downloads/compteur-retour
git init && git add . && git commit -m "Compteur retour"
gh repo create compteur-retour --public --source=. --push
gh api -X POST /repos/:owner/compteur-retour/pages -f source.branch=main -f source.path=/
```
URL : `https://<ton-username>.github.io/compteur-retour/`

---

## 2) Raccourci iOS — Notification quotidienne à 9 h

Sur l'iPhone de ta copine, ouvre l'app **Raccourcis** (Shortcuts, native iOS) et crée le raccourci suivant :

### Raccourci « Compteur Berlin → Strasbourg »

1. App Raccourcis → onglet **Raccourcis** → bouton **+** en haut à droite.
2. Renomme-le « Compteur Strasbourg ».
3. Ajoute les actions dans cet ordre exact :

| # | Action | Configuration |
|---|--------|---------------|
| 1 | **Date** | Date « 30 juin 2026 à 18:34 » |
| 2 | **Date** | Date « Date actuelle » |
| 3 | **Obtenir le temps entre des dates** | De : Sortie action 2 (Date actuelle) — À : Sortie action 1 (30 juin) — En : **Heures** |
| 4 | **Texte** | Tape : `Plus que [Sortie action 3] heures avant de rentrer à Strasbourg 💕` |
| 5 | **Afficher la notification** | Titre : `Bientôt à la maison` — Corps : Sortie action 4 |

Teste le raccourci avec le bouton ▶︎ : une notification doit s'afficher avec le nombre d'heures.

### Automation à 9 h tous les matins

1. App Raccourcis → onglet **Automatisation** → **+** en haut à droite.
2. Choisis **Heure du jour** → règle sur **09:00**, **Tous les jours**.
3. Décoche **Demander avant d'exécuter** (sinon ça ne notifie pas tout seul).
4. Action : **Exécuter le raccourci** → choisis « Compteur Strasbourg ».
5. Enregistre.

→ Chaque matin à 9 h, elle reçoit la notification avec le nombre d'heures exactes restantes.

---

## 3) Widget sur l'écran d'accueil

iOS ne permet pas aux Raccourcis d'afficher un widget qui se met à jour automatiquement, **mais** deux options :

### Option A — Bouton Raccourci (le plus simple, gratuit, natif)

1. Appui long sur l'écran d'accueil → **+** en haut à gauche → cherche **Raccourcis**.
2. Ajoute un widget **Raccourci unique** (taille au choix).
3. Appui long sur le widget → **Modifier le widget** → choisis « Compteur Strasbourg ».

→ Un tap sur le widget lance le raccourci et affiche la notif avec le nombre d'heures.

### Option B — Vrai widget auto-actualisé (via l'app gratuite **Scriptable**)

1. Installe **Scriptable** depuis l'App Store (gratuit).
2. Ouvre Scriptable → **+** → colle le script ci-dessous → nomme-le « CompteurStrasbourg ».
3. Appui long sur l'écran d'accueil → **+** → **Scriptable** → ajoute un widget petit.
4. Appui long sur le widget → **Modifier le widget** → Script : « CompteurStrasbourg ».

```javascript
// CompteurStrasbourg.js — widget Scriptable
const TARGET = new Date('2026-06-30T18:34:00+02:00');
const now = new Date();
const diffMs = TARGET - now;
const hours = Math.max(0, Math.floor(diffMs / 3600000));
const days = Math.max(0, Math.floor(diffMs / 86400000));

const w = new ListWidget();
w.backgroundGradient = (() => {
  const g = new LinearGradient();
  g.colors = [new Color("#1a0a2e"), new Color("#4a1942")];
  g.locations = [0, 1];
  return g;
})();

const label = w.addText("BERLIN → STRASBOURG");
label.font = Font.systemFont(9);
label.textColor = new Color("#ffb3c7");
w.addSpacer(6);

const big = w.addText(`${hours}`);
big.font = Font.lightSystemFont(48);
big.textColor = new Color("#ffd8e6");

const sub = w.addText(hours <= 1 ? "heure restante" : "heures restantes");
sub.font = Font.systemFont(11);
sub.textColor = new Color("#ff7eb3");

w.addSpacer(4);
const dd = w.addText(`${days} j  •  30 juin 18 h 34`);
dd.font = Font.systemFont(10);
dd.textColor = new Color("#ffffff99");

Script.setWidget(w);
Script.complete();
```

→ Le widget se rafraîchit automatiquement (iOS choisit la fréquence, ~toutes les 15-30 min).

---

## Récap pour elle

1. Reçoit l'URL Vercel → l'ouvre sur Safari → **Partager** → **Sur l'écran d'accueil** (icône web app cœur).
2. Crée le raccourci « Compteur Strasbourg » (5 actions).
3. Crée l'automation 9 h tous les jours.
4. (Optionnel) Installe Scriptable pour un vrai widget auto-actualisé.

💕
