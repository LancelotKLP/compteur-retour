# Compteur — Retour de Berlin

Web app pour compter les heures jusqu'au **30 juin 2026, 18 h 34** à Strasbourg, avec :
- **Compteur** en temps réel
- **Capsules quotidiennes** + paliers J-X + streak
- **Jeu mémoire** avec vos photos
- **Dessin du jour partagé** : un sujet à 8 h, vous dessinez chacun de votre côté, révélation à minuit

---

## ⚠️ Avant tout — sécurité

La `service_role` key Supabase a fuité dans la conversation. **Régénère-la immédiatement** :
Dashboard Supabase → Project Settings → API → bouton **Reset service_role secret**.

Cette clé bypass toutes les règles RLS — elle ne doit jamais être commitée ni partagée. Le front n'utilise que l'`anon` key (faite pour être publique).

---

## 1) Setup Supabase (à faire 1 seule fois)

### a) Exécuter le SQL
Dashboard Supabase → **SQL Editor** → **+ New query** → copie-colle le contenu de [supabase-setup.sql](supabase-setup.sql) → **Run**.

Ça crée :
- 3 tables : `couples`, `profiles`, `drawings`
- Les Row Level Security policies (vous ne voyez les dessins de l'autre qu'**après minuit Paris**)
- Un helper SQL `my_couple_id()`

### b) Activer l'authentification anonyme
Dashboard → **Authentication** → **Providers** → trouve **Anonymous Sign-ins** → **Enable**.

Sans ça, l'app n'arrive pas à créer de comptes.

---

## 2) Déploiement

Déjà sur GitHub Pages : https://lancelotklp.github.io/compteur-retour/

Pour redéployer après modif : `git push` (Pages reconstruit automatiquement).

---

## 3) Premier lancement (toi)

1. Va sur l'URL.
2. Onglet **🎨 Dessin** → **Créer un couple**.
3. Entre ton pseudo.
4. **Note bien le code à 6 caractères affiché** — copie-le.

## 4) Premier lancement (ta copine)

1. Tu lui envoies l'URL + le code.
2. Onglet **🎨 Dessin** → **Rejoindre un couple**.
3. Entre le code + son pseudo.

Vous êtes liés. Chaque matin, ouvrez l'app, dessinez. À minuit Paris, les deux dessins apparaissent dans "Dessins d'aujourd'hui" et s'archivent dans la galerie.

---

## 5) Raccourcis iOS — Notifications

Sur l'iPhone de ta copine (et le tien aussi si tu veux), ouvre l'app **Raccourcis**.

### Raccourci 1 — « Compteur Strasbourg » (notif 9 h)

| # | Action | Configuration |
|---|--------|---------------|
| 1 | **Date** | « 30 juin 2026 à 18:34 » |
| 2 | **Date** | « Date actuelle » |
| 3 | **Obtenir le temps entre des dates** | De : sortie #2 — À : sortie #1 — Unité : **Heures** |
| 4 | **Texte** | `Plus que [sortie #3] heures avant de rentrer 💕` |
| 5 | **Afficher la notification** | Titre : `Bientôt à la maison` — Corps : sortie #4 |

→ App Raccourcis → onglet **Automatisation** → **+** → **Heure du jour** → **09:00** tous les jours → **Décocher "Demander avant d'exécuter"** → **Exécuter le raccourci** : Compteur Strasbourg.

### Raccourci 2 — « Sujet du jour » (notif 8 h)

Approche simple : on encode la même logique que l'app (liste de 65 sujets, cyclique depuis le 12 mai 2026).

| # | Action | Configuration |
|---|--------|---------------|
| 1 | **Texte** | Colle la liste complète des 65 sujets (un par ligne — copie depuis `content.js` champ `dailyPrompts`) |
| 2 | **Diviser le texte** | Texte : sortie #1 — Séparateur : **Nouvelle ligne** |
| 3 | **Date** | « 12 mai 2026 à 00:00 » |
| 4 | **Date** | « Date actuelle » |
| 5 | **Obtenir le temps entre des dates** | De : sortie #3 — À : sortie #4 — Unité : **Jours** |
| 6 | **Calculer** | sortie #5 **modulo** 65 → résultat = index |
| 7 | **Obtenir l'élément de la liste** | Liste : sortie #2 — Élément à l'index : sortie #6 (ajoute +1 si Raccourcis compte à partir de 1) |
| 8 | **Afficher la notification** | Titre : `🎨 Sujet du jour` — Corps : `[sortie #7]. Vous avez jusqu'à minuit pour dessiner.` |

→ Automatisation **Heure du jour** → **08:00** tous les jours → ce raccourci.

**Plus simple** si tu n'as pas envie de configurer la liste complète : remplace l'action #1 par un simple **Texte** disant `Va voir l'app pour découvrir le sujet du jour ✨` et fais juste la notification d'incitation à 8 h.

---

## 6) Widget iOS (optionnel)

Cf. version précédente du README (section Scriptable) — toujours valide.

---

## Personnalisation

Tout le contenu éditable est dans [content.js](content.js) :
- `capsules` : messages quotidiens
- `milestones` : messages des paliers J-X
- `memoryPairs` : pool de photos pour le jeu mémoire
- `dailyPrompts` : liste des 65 sujets de dessin (ordre = ordre de défilement)

Pour ajouter une photo au jeu mémoire :
```bash
sips -s format jpeg -Z 600 -s formatOptions 80 photos/MA_PHOTO.HEIC --out photos/web/ma_photo.jpg
```
puis ajoute la ligne `{ img: "photos/web/ma_photo.jpg" },` dans `memoryPairs`.

Date cible / fuseau : modifiables dans [app.js](app.js) (`TARGET`) et [config.js](config.js) (`PROMPTS_START_DATE`).

---

## Architecture

- **Front** : HTML/CSS/JS vanilla, zéro build, 4 fichiers (`index.html`, `app.js`, `content.js`, `config.js`)
- **Back** : Supabase (PostgreSQL + Auth anonyme + RLS)
- **Stockage dessin** : PNG en base64 directement dans la colonne `drawings.image_data` (pas de Storage bucket → RLS plus simple, sécurité plus stricte)
- **Persistance locale** : capsules, streak, record du jeu mémoire dans `localStorage`
- **Persistance distante** : couple + profils + dessins dans Supabase
- **Hébergement** : GitHub Pages (statique)
