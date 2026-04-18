# 📱 Sport Calendar – Guide d'installation ULTRA SIMPLE

Vous n'avez **rien à installer** sur votre ordinateur. Tout se passe en ligne.
Durée totale : **15 minutes**. Seul prérequis : un compte GitHub gratuit.

---

## 🎯 Étape 1 — Créer un compte GitHub (2 min)

1. Allez sur **https://github.com/signup**
2. Créez un compte gratuit (email, mot de passe, nom d'utilisateur)
3. Confirmez votre email

---

## 📂 Étape 2 — Créer votre dépôt (1 min)

1. Une fois connecté, cliquez sur le **+** en haut à droite → **New repository**
2. Nommez-le : `sport-calendar`
3. Laissez-le en **Public** (obligatoire pour les builds gratuits)
4. **Ne cochez rien** en dessous
5. Cliquez sur **Create repository**

---

## ⬆️ Étape 3 — Uploader les fichiers (5 min)

Vous êtes sur la page de votre nouveau dépôt vide. Vous voyez un lien bleu :

> **"uploading an existing file"**

1. Cliquez dessus
2. **Décompressez le zip `SportCalendar.zip`** que je vous ai fourni sur votre ordinateur
3. Dans la fenêtre GitHub, **glissez-déposez TOUT le contenu** du dossier décompressé (pas le dossier lui-même, mais tout ce qu'il contient : `src/`, `android/`, `App.tsx`, `package.json`, etc.)
4. Attendez que tout soit uploadé (la barre de progression en bas)
5. En bas de la page, dans le champ du commit, tapez : `Première version`
6. Cliquez sur le bouton vert **Commit changes**

> ⚠️ **Important** : le dossier `.github` doit bien être présent dans l'upload. Sur certains systèmes il est caché — sur Windows activez « Afficher les éléments masqués », sur Mac faites `Cmd+Shift+.` dans le Finder.

---

## 🤖 Étape 4 — Lancer la compilation (1 min + 10 min d'attente)

Le robot GitHub démarre tout seul dès que vous avez uploadé. Pour suivre :

1. Sur votre dépôt, cliquez sur l'onglet **Actions** (en haut)
2. Vous voyez une ligne « Build Android APK » avec un rond **jaune qui tourne**
3. Cliquez dessus pour voir l'avancement (facultatif)
4. **Attendez 10 minutes** ☕

Quand le rond devient **vert** ✅, c'est gagné !

---

## 📥 Étape 5 — Télécharger votre APK (1 min)

1. Toujours dans l'onglet **Actions**, cliquez sur la ligne verte « Build Android APK »
2. Descendez en bas de la page
3. Dans la section **Artifacts**, cliquez sur **SportCalendar-APK**
4. Un fichier `SportCalendar-APK.zip` se télécharge
5. **Décompressez-le** : vous obtenez `app-release.apk` 🎉

---

## 📲 Étape 6 — Installer sur votre tablette (3 min)

### Option A — Par câble USB (la plus simple)

1. Branchez la tablette à l'ordinateur
2. Sur la tablette, acceptez « Autoriser le transfert de fichiers »
3. Copiez le fichier `app-release.apk` dans le dossier **Téléchargements** de la tablette
4. Débranchez

### Option B — Par email ou Google Drive

1. Envoyez-vous le fichier `app-release.apk` par email (ou mettez-le sur Drive)
2. Ouvrez l'email / Drive sur la tablette
3. Téléchargez le fichier sur la tablette

### Puis, sur la tablette :

1. Ouvrez l'application **Fichiers** (ou **Mes fichiers** selon la marque)
2. Allez dans **Téléchargements**
3. Appuyez sur `app-release.apk`
4. Android vous dit « Installation bloquée » → appuyez sur **Paramètres**
5. Activez **Autoriser cette source**
6. Revenez en arrière et appuyez sur **Installer**
7. Attendez 20 secondes → **Ouvrir** 🎉

**L'icône « Sport Calendar » apparaît sur votre écran d'accueil !**

---

## 🔄 Pour mettre à jour l'app plus tard

Si vous voulez changer quelque chose dans l'app, il suffit de :
1. Modifier un fichier sur GitHub (éditeur en ligne intégré)
2. Cliquer sur **Commit changes**
3. Le robot recompile automatiquement
4. Téléchargez le nouveau APK dans Actions → Artifacts
5. Installez-le par-dessus l'ancien sur la tablette (pas besoin de désinstaller)

---

## ❓ En cas de problème

### Le build est rouge ❌
- Cliquez sur le build rouge dans **Actions**
- Regardez quel « step » a échoué (rond rouge à gauche)
- Copiez-moi le message d'erreur et je corrige

### « Application non installée » sur la tablette
- Désinstallez une ancienne version avant de réinstaller
- Vérifiez que vous avez au moins 200 Mo d'espace libre
- Votre Android doit être au minimum version 6.0 (Marshmallow)

### L'app plante au démarrage
- C'est probablement la connexion Google Calendar qui manque de configuration
- Ouvrez simplement l'app, allez dans **Paramètres**, et **désactivez Google Calendar**
- Le reste fonctionne sans cette connexion

---

## 📝 Ce que fait l'application

✅ Calendrier mensuel avec points colorés par importance
✅ 25 sports et esports (football, basket, F1, LoL, Valorant, CS2, etc.)
✅ Code couleur Tier S (rouge/doré), A (orange), B (bleu), C (gris)
✅ Notifications avant les matches (configurables)
✅ Mode hors ligne (données en cache)
✅ Thème clair/sombre/auto
✅ Optimisé tablette (affichage 2 colonnes)
✅ Événements de démonstration pré-chargés

### ⚠️ Pour utiliser Google Calendar et les vraies données esport

Ces fonctions sont **optionnelles**. L'app fonctionne sans. Si vous voulez les activer plus tard, il faudra créer des clés API gratuites. Je peux vous expliquer quand vous serez prêt.

---

**Bon match ! 🏆**
