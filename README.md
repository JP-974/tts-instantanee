# tts-instantanee

Page web de synthèse vocale instantanée, autonome et sans dépendance (Web Speech API).

## Utilisation

Ouvrir `index.html` dans un navigateur (Chrome, Edge ou Firefox). Écrire ou coller du
texte (Ctrl+V) dans le champ : la lecture démarre automatiquement. On peut aussi ouvrir
un fichier PDF (bouton « Ouvrir un PDF » ou glisser-déposer) : le texte est extrait puis lu.

## Fichiers

- `index.html` — structure de la page
- `style.css` — mise en forme
- `app.js` — lecture automatique, extraction PDF, contrôles (lire / pause / arrêter, voix, vitesse, hauteur)
- `vendor/` — PDF.js 3.11.174 (build legacy, © Mozilla Foundation, licence Apache 2.0, voir `vendor/LICENSE.pdfjs`)
