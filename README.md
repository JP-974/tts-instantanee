# tts-instantanee

Page web de synthèse vocale instantanée, autonome et sans dépendance (Web Speech API).

## Utilisation

Ouvrir `index.html` dans un navigateur (Chrome, Edge ou Firefox). Écrire ou coller du
texte (Ctrl+V) dans le champ : la lecture démarre automatiquement. On peut aussi ouvrir
ou glisser-déposer un fichier (PDF, txt, md, csv, json, xml, html…) : le texte est extrait
puis lu. Le bouton « Effacer » vide le champ et arrête la lecture. Dans « Réglages », les
voix marquées ✨ (neural / premium) sont les plus naturelles.

## Fichiers

- `index.html` — structure de la page
- `style.css` — mise en forme
- `favicon.png` — icône de l'onglet et logo de l'en-tête
- `app.js` — lecture automatique, extraction PDF/fichiers texte, contrôles (lire / pause / arrêter / effacer, voix, vitesse, hauteur)
- `vendor/` — PDF.js 3.11.174 (build legacy, © Mozilla Foundation, licence Apache 2.0, voir `vendor/LICENSE.pdfjs`)
