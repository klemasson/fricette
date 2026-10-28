# Fricette : mise en ligne chez Infomaniak

Fricette, c'est un site qui propose des recettes à partir de ce qu'il y a dans ton frigo, avec les quantités.

- **Gratuit et illimité** : un carnet de 600 recettes, chacune avec sa photo, intégré au site. La recherche se fait dans le navigateur du visiteur : elle ne te coûte rien, même avec beaucoup de monde.
- **1 recette « du chef » offerte par jour** : inventée par Claude pour le frigo exact du visiteur.
- **Lancement 100 % gratuit** : tant que Stripe n'est pas configuré, il n'y a ni prix ni bouton « S'abonner » sur le site. Quand le visiteur a utilisé sa recette du chef, on lui dit simplement de revenir demain.
- **Plus tard, si tu veux** : un abonnement mensuel (Stripe) pour des recettes du chef sans compter. Tout est déjà prêt dans le code, il suffit de suivre l'étape 7.

> **Lancement sans IA (ta configuration actuelle) :** aucune clé n'est nécessaire. Saute les étapes 1, 5 et 7 : le site fonctionne avec le carnet de 600 recettes, sans fichier `.env.local`. Le bouton du chef et l'analyse de photo n'apparaissent que si une clé d'IA est ajoutée plus tard.

Ce guide part de zéro. Compte environ 1 h la première fois, tout se fait dans le navigateur.
Coche chaque case au fur et à mesure.

---

## Ce dont tu as besoin

| Service | À quoi il sert | Prix |
|---|---|---|
| **Infomaniak** – Hébergement Web | Mettre le site en ligne + ton nom de domaine | Dès 10,91 CHF/mois après 30 jours d'essai, + le domaine |
| **Anthropic** (Claude) | Inventer les recettes | Payé à l'usage |
| **Stripe** *(plus tard)* | Encaisser les abonnements | Commission par paiement, sans abonnement |

Pas besoin de GitHub ni de base de données : le compteur des recettes offertes tourne directement sur ton hébergement.

---

## Étape 1 · Obtenir ta clé Claude

- [ ] Va sur [console.anthropic.com](https://console.anthropic.com) et crée un compte.
- [ ] Dans **Billing**, ajoute une carte et un petit crédit (10 $ suffisent pour démarrer).
- [ ] Toujours dans **Billing**, règle une **limite de dépense mensuelle** (par ex. 20 $). C'est ta protection contre une mauvaise surprise.
- [ ] Dans **API Keys**, clique sur **Create Key**, nomme-la `fricette` et copie la clé (`sk-ant-…`) dans un endroit sûr. Elle ne s'affiche qu'une fois.

## Étape 2 · Prendre l'hébergement et le domaine chez Infomaniak

- [ ] Sur [infomaniak.com](https://www.infomaniak.com), crée un compte.
- [ ] Commande un **nom de domaine** (par ex. `fricette.ch`), si tu n'en as pas déjà un.
- [ ] Commande l'offre **Hébergement Web** (pas le « Site Creator » ni « WordPress ») : c'est elle qui accepte les sites Node.js. L'essai gratuit de 30 jours te laisse le temps de tout tester.

## Étape 3 · Créer le site Node.js

- [ ] Dans le **Manager** Infomaniak, ouvre ton **Hébergement Web**.
- [ ] Clique sur le bouton bleu **Ajouter**.
- [ ] Choisis **un projet avec des technologies avancées**, puis **Node.js**.
- [ ] Version de Node.js : prends la plus récente marquée **LTS** (20 ou plus).
- [ ] Choisis ton domaine (par ex. `fricette.ch`).
- [ ] Méthode : **Personnalisée**, puis **import d'un fichier ZIP**.
- [ ] Envoie le fichier `fricette.zip` **tel quel**, sans le décompresser.
- [ ] Valide. Infomaniak décompresse les fichiers dans le dossier du site.

## Étape 4 · Régler le lancement du site

- [ ] Dans le Manager, clique sur le nom du site, puis **Gérer les paramètres avancés**, onglet **Node.js**.
- [ ] Remplis exactement :

  | Champ | Valeur |
  |---|---|
  | Dossier d'exécution | `./` (le dossier qui contient `package.json`) |
  | Commande de construction | `npm install && npm run build` |
  | Commande de lancement | `npm start` |

- [ ] Ne touche pas au **port** : Infomaniak le transmet tout seul au site.
- [ ] **Enregistre**, mais ne démarre pas encore : il manque les clés (étape suivante).

## Étape 5 · Ajouter tes clés secrètes

Les clés vont dans un fichier `.env.local`, que le site lit au démarrage.

- [ ] Ouvre le **gestionnaire de fichiers** de ton hébergement (ou connecte-toi en SFTP) et va dans le dossier du site.
- [ ] Trouve le fichier `.env.example`. S'il n'apparaît pas, active l'affichage des **fichiers cachés** (ceux qui commencent par un point).
- [ ] **Duplique-le** et renomme la copie en `.env.local` (avec le point au début, sans `.txt` à la fin).
- [ ] Ouvre `.env.local` et remplis ces lignes :

  ```
  ANTHROPIC_API_KEY=sk-ant-…            ← ta clé de l'étape 1
  ANTHROPIC_MODEL=claude-sonnet-5-5
  SESSION_SECRET=…                      ← voir ci-dessous
  SITE_URL=https://fricette.ch      ← ton adresse exacte, sans « / » à la fin
  MOCK_AI=0
  ```

  Pour `SESSION_SECRET`, génère un mot de passe de 40 caractères au hasard avec ton gestionnaire de mots de passe (lettres et chiffres uniquement) et colle-le. Ne le change plus ensuite : cela déconnecterait les abonnés.

- [ ] Laisse vides pour l'instant les lignes `STRIPE_…`, `UPSTASH_…` et `RESEND_…`.
- [ ] Enregistre le fichier.

> ⚠️ Ce fichier contient tes clés : ne l'envoie jamais à personne et ne le publie nulle part.

## Étape 6 · Démarrer et tester

- [ ] Retourne dans le **tableau de bord** du site Node.js et clique sur **Démarrer** (ou **Redémarrer**).
- [ ] La première fois, la construction prend 1 à 3 minutes. Suis l'avancement dans la **console d'exécution**.
- [ ] Active le **certificat SSL** (HTTPS) pour ton domaine depuis le tableau de bord, s'il ne l'est pas déjà.
- [ ] Ouvre ton site : les recettes du carnet s'affichent tout de suite sous le frigo d'exemple.
- [ ] Clique sur **Allô le chef ? Invente-moi un truc** : tu dois recevoir 3 recettes inventées en 20 à 40 secondes.

✅ Ton site est en ligne et tu peux déjà partager le lien.

**Si ça ne marche pas :**
- « Dans le carnet : Chargement… » qui ne disparaît pas → le fichier `public/carnet.json` manque : renvoie le zip complet.
- Message rouge « Mode simulation actif » → la clé Claude n'est pas lue. Vérifie le nom exact du fichier (`.env.local`) et `MOCK_AI=0`, puis redémarre.
- « Le chef n'a pas pu répondre » → clé Claude incorrecte ou crédit épuisé dans la console Anthropic.
- Page blanche ou erreur → ouvre la console d'exécution et envoie-moi une capture d'écran.

## Étape 7 *(plus tard)* · Activer l'abonnement (Stripe)

Saute cette étape pour le lancement gratuit. Reviens-y quand tu auras des visiteurs fidèles.

Commence en **mode test** : tout fonctionne avec une fausse carte, sans argent réel.

- [ ] Crée un compte sur [stripe.com](https://stripe.com). En haut à droite, active **Mode test**.
- [ ] **Catalogue de produits → Ajouter un produit** :
  - Nom : `Fricette – illimité`
  - Prix : `4.90`, devise **CHF**, **Récurrent**, **Mensuel**
  - Enregistre, ouvre le prix et copie son identifiant (`price_…`).
- [ ] **Développeurs → Clés API** : copie la **clé secrète** (`sk_test_…`).
- [ ] **Paramètres → Facturation → Portail client** : clique sur **Activer**, autorise l'annulation des abonnements et la mise à jour des moyens de paiement. C'est la page « Gérer mon abonnement » de tes clients.
- [ ] Dans `.env.local`, remplis :

  ```
  STRIPE_SECRET_KEY=sk_test_…
  STRIPE_PRICE_ID=price_…
  PRICE_LABEL=4,90 CHF / mois
  ```

- [ ] **Redémarre** le site.
- [ ] Test : demande une recette sur mesure ; à la 2ᵉ demande, l'offre apparaît. Clique sur **S'abonner** et paie avec la carte de test `4242 4242 4242 4242`, n'importe quelle date future, CVC `123`.
- [ ] Tu reviens sur le site avec le badge **Abonné·e**, et « Gérer mon abonnement » en bas de page ouvre l'espace Stripe.

**Passer en vrai** (quand tout marche) :
- [ ] Dans Stripe, quitte le mode test et active ton compte (identité, IBAN).
- [ ] Recrée le produit et le prix en mode réel, et réactive le portail client en mode réel.
- [ ] Dans `.env.local`, remplace par la clé `sk_live_…` et le nouveau `price_…`, puis redémarre.

## Étape 8 · Avant de lancer (et avant d'encaisser)

- [ ] Même gratuit, le site doit indiquer qui l'édite et comment il traite les données. Complète les passages `[À COMPLÉTER]` du fichier `app/conditions/page.js` (ton identité, ton contact, ta politique de remboursement), avec le gestionnaire de fichiers. Redémarre ensuite le site pour reconstruire la page.
- [ ] Fais relire ces conditions par quelqu'un de compétent : ce modèle n'est pas un avis juridique.
- [ ] Le jour où tu actives l'abonnement : renseigne-toi sur tes obligations : statut d'indépendant, et TVA si ton chiffre d'affaires annuel dépasse 100 000 CHF.

---

## Option · Retrouver son abonnement sur un autre appareil

L'abonnement est mémorisé dans le navigateur où la personne a payé. Pour qu'elle le retrouve sur son téléphone, le site peut lui envoyer un lien de connexion par e-mail.

- [ ] Crée un compte sur [resend.com](https://resend.com) et ajoute ton domaine. Resend te donne des lignes DNS à copier dans le Manager Infomaniak, rubrique **Domaine → Zone DNS**.
- [ ] Crée une clé API Resend, puis remplis dans `.env.local` :
  ```
  RESEND_API_KEY=re_…
  EMAIL_FROM=Fricette <bonjour@fricette.ch>
  ```
- [ ] Redémarre : le lien « Déjà abonné·e ? » apparaît en bas de page.

## Bon à savoir

- **Le compteur gratuit** est gardé en mémoire et se remet à zéro quand tu redémarres le site. C'est sans gravité. Le message « Upstash Redis n'est pas configuré » dans la console est normal.
- **Après chaque modification** de `.env.local` ou d'un fichier : redémarre le site depuis le tableau de bord.
- **Coût de Claude** : seules les recettes « sur mesure » et les photos coûtent. Une génération envoie environ 600 mots et en reçoit environ 1 500. Consulte les tarifs sur [anthropic.com/pricing](https://www.anthropic.com/pricing). Pour payer moins, mets `ANTHROPIC_MODEL=claude-haiku-5-5` (recettes un peu plus simples) ou baisse `FREE_RECIPES_PER_DAY`.

## Réglages disponibles dans `.env.local`

| Variable | Défaut | Rôle |
|---|---|---|
| `FREE_RECIPES_PER_DAY` | 1 | Demandes « sur mesure » offertes par jour et par visiteur (le carnet, lui, est illimité) |
| `FREE_PHOTOS_PER_DAY` | 1 | Analyses de photo offertes par jour |
| `PRO_RECIPES_PER_DAY` | 60 | Plafond quotidien des abonnés (protège ta facture) |
| `PRICE_LABEL` | 4,90 CHF / mois | Prix affiché dans l'offre |
| `MOCK_AI` | 0 | `1` = fausses recettes, sans appeler Claude (tests gratuits) |

## Comment c'est construit

- `app/page.js` : la page (frigo, quantités, options, recettes, offre).
- `public/carnet.json` : le carnet de recettes, servi au navigateur.
- `lib/match.js` : la recherche dans le carnet (reconnaît « tomates cerises bio » ou « gruyère râpé », adapte les quantités au nombre de personnes, signale quand il te manque un peu d'un ingrédient).
- `app/api/recipes` et `app/api/photo` : appellent Claude, après vérification du quota.
- `app/api/checkout`, `app/api/stripe/success`, `app/api/portal` : abonnement Stripe.
- `app/api/restore` : lien de connexion par e-mail pour les abonnés.
- `lib/quota.js` : 3 essais par jour et par visiteur, avec une limite plus large par connexion internet pour éviter qu'on contourne en effaçant ses cookies.
- La clé Claude reste sur le serveur et n'apparaît jamais dans le navigateur.

## Ajouter tes propres recettes au carnet

Les recettes sont dans `data/parts/` (un fichier par thème), au format décrit dans `data/FORMAT.md`.
Pour en ajouter : écris-les dans un de ces fichiers (ou dans un nouveau `data/parts/7-mes-recettes.json`), puis, sur ton ordinateur, lance `npm run carnet`. La commande vérifie chaque recette et régénère `public/carnet.json`, que tu renvoies ensuite sur ton hébergement.

Les ingrédients doivent utiliser les clés de `data/vocab.js`. Pour qu'un nouvel ingrédient soit reconnu, ajoute-le à cette liste avec ses synonymes.

## Étape 9 · Photos des recettes (automatique)

Chaque recette a une photo générée par IA (modèle libre LCM Dreamshaper v7), dans `public/photos/`.
Elles sont créées automatiquement par GitHub (onglet **Actions** du dépôt, « Photos des recettes ») dès qu'une recette est ajoutée ou modifiée dans `data/parts/` : rien à payer, rien à installer. La description en anglais de chaque plat, utilisée par le générateur, est dans `data/photo-prompts.json`.

- Refaire une photo : supprime son fichier dans `public/photos/` sur GitHub, puis lance « Photos des recettes » depuis l'onglet **Actions** (bouton **Run workflow**).
- Remplacer une photo par la tienne : dépose ton image sous le même nom (format `.webp`, `.jpg` ou `.png`).
- Le résultat de la dernière génération est dans `scripts/photos-report.txt`.

## Mettre à jour le site chez Infomaniak

Quand tu reçois une nouvelle version de `fricette.zip` :

1. Dans le Manager, ouvre le **gestionnaire de fichiers (FTP)** de ton hébergement, va dans `sites/fricette.ch` et envoie-y `fricette.zip`.
2. Ouvre la **console SSH** et tape, une ligne à la fois :
   ```
   cd ~/sites/fricette.ch
   unzip -o fricette.zip && rm fricette.zip
   npm install && npm run build
   ```
3. Sur la page du site, clique sur **Redémarrer**.
