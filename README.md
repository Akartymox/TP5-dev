# TP5 — Tutoriel HTTP/Express Node.js

**Auteur :** Liam J.

## Installation

\`\`\`bash
npm install
\`\`\`

## Scripts disponibles

| Script | Commande | Rôle |
|---|---|---|
| `npm run http-dev` | `cross-env NODE_ENV=development nodemon server-http.mjs` | Serveur HTTP natif en dev |
| `npm run http-prod` | `cross-env NODE_ENV=production node server-http.mjs` | Serveur HTTP natif en prod |
| `npm run express-dev` | `cross-env NODE_ENV=development nodemon server-express.mjs` | Serveur Express en dev |
| `npm run express-prod` | `cross-env NODE_ENV=production node server-express.mjs` | Serveur Express en prod |

## Routes

- `GET /` ou `GET /index.html` → page d'accueil
- `GET /random/:nb` → génère `nb` nombres aléatoires
- Toute autre URL → erreur 404

---

## Partie 1 — Serveur HTTP natif

### Q1.1 — En-têtes de la réponse HTTP

\`\`\`
HTTP/1.1 200 OK
Date: <date>
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 36
\`\`\`

Node ajoute automatiquement :
- `Date` : date de la réponse
- `Connection: keep-alive` : la connexion reste ouverte
- `Keep-Alive: timeout=5` : timeout d'inactivité à 5 secondes
- `Content-Length` : taille du corps en octets

### Q1.2 — En-têtes changés

**Ajouté :**

\`\`\`
Content-Type: application/json
\`\`\`

**Modifié :**

\`\`\`
Content-Length: 21  (au lieu de 36)
\`\`\`

Les autres en-têtes (`Date`, `Connection`, `Keep-Alive`) restent inchangés.

### Q1.3 — Contenu de la réponse reçue par le client

Le client reçoit le contenu complet du fichier `index.html` avec :
- statut `200 OK`
- `Content-Type: text/html`

Si `index.html` est absent, le client ne reçoit rien (le `.catch` se contente de log l'erreur) → timeout du navigateur.

### Q1.4 — Erreur affichée dans la console

\`\`\`
[Error: ENOENT: no such file or directory, open 'index.html'] {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'index.html'
}
\`\`\`

**Code d'erreur : `ENOENT`** (Error NO ENTry = « pas de telle entrée »).

Documentation : <https://nodejs.org/api/errors.html#common-system-errors>

`errno: -4058` est la valeur spécifique à Windows pour `ENOENT`.

### Q1.5 — `requestListener` en `async/await` avec gestion d'erreur

\`\`\`js
async function requestListener(_request, response) {
  try {
    const contents = await fs.readFile("index.html", "utf8");
    response.setHeader("Content-Type", "text/html");
    response.writeHead(200);
    return response.end(contents);
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    return response.end("<html><p>500: INTERNAL SERVER ERROR</p></html>");
  }
}
\`\`\`

### Q1.6 — Ce que ces commandes ont modifié

- `cross-env` a été ajouté dans `dependencies` (à cause de `--save`)
- `nodemon` a été ajouté dans `devDependencies` (à cause de `--save-dev`)
- `node_modules/` a été enrichi
- `package-lock.json` a été mis à jour

### Q1.7 — Différences entre `http-dev` et `http-prod`

| Aspect | `http-dev` | `http-prod` |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| Exécutable | `nodemon` | `node` |
| Rechargement auto | Oui | Non |
| Usage | développement | production |

`NODE_ENV` conditionne le comportement d'Express (`app.get("env")`) et de nombreuses bibliothèques (logs verbeux, stack traces, cache…).

### Q1.8 — Codes HTTP des quatre URLs

| URL | Code | Raison |
|---|---|---|
| `/index.html` | **200** | fichier trouvé |
| `/random.html` | **200** | généré dynamiquement |
| `/` | **200** | traité comme `/index.html` |
| `/dont-exist` | **404** | aucune route ne correspond |

---

## Partie 2 — Framework Express

### Q2.1 — URLs de documentation

- **express** : <https://expressjs.com/>
- **http-errors** : <https://github.com/jshttp/http-errors>
- **loglevel** : <https://github.com/pimterry/loglevel>
- **morgan** : <https://github.com/expressjs/morgan>

### Q2.2 — Vérification des trois routes

- <http://localhost:8000/> → OK
- <http://localhost:8000/index.html> → OK
- <http://localhost:8000/random/5> → 5 nombres aléatoires

### Q2.3 — En-têtes fournis par Express

\`\`\`
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: ...
ETag: W/"..."
Date: ...
Connection: keep-alive
Keep-Alive: timeout=5
\`\`\`

**Nouveaux par rapport au serveur HTTP natif :**
- `X-Powered-By: Express` — signe la présence d'Express
- `ETag` — identifiant de version pour le cache
- `Content-Type` — déduit automatiquement par Express

### Q2.4 — Événement `listening`

L'événement `listening` est déclenché **quand le serveur a fini de démarrer** et commence à accepter des connexions, c'est-à-dire une fois que `server.listen(port, host)` a bien ouvert le socket sur le port demandé. À ce moment, `server.address()` renvoie des valeurs valides.

### Q2.5 — Option qui redirige `/` vers `/index.html`

C'est l'option **`index`** de `express.static`, activée par défaut (`index: "index.html"`).

Documentation : <https://expressjs.com/en/resources/middleware/serve-static.html>

### Q2.6 — Codes HTTP sur `style.css`

| Action | Code | Explication |
|---|---|---|
| Rafraîchir normal (Ctrl+R) | **304 Not Modified** | Le navigateur envoie `If-None-Match`, le serveur répond `304` → réutilisation du cache |
| Forcer (Ctrl+Shift+R) | **200 OK** | Le navigateur envoie `Cache-Control: no-cache`, le serveur renvoie le fichier complet |

### Q2.7 — Différence entre prod et dev

| Mode | Affichage de `error.ejs` |
|---|---|
| **development** | message d'erreur + **stack trace complète** |
| **production** | message d'erreur seul, `stack = ""` |

C'est le comportement classique d'Express : ne jamais exposer les stack traces en production pour des raisons de sécurité.