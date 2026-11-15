const textArea = document.getElementById('texte');
const btnLire = document.getElementById('btn-lire');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const selectVoix = document.getElementById('voix');
const vitesse = document.getElementById('vitesse');
const hauteur = document.getElementById('hauteur');
const auto = document.getElementById('auto');
const statut = document.getElementById('statut');
const vitesseVal = document.getElementById('vitesse-val');
const hauteurVal = document.getElementById('hauteur-val');
const inputFichier = document.getElementById('fichier');
const btnEffacer = document.getElementById('btn-effacer');

let debounceTimer = null;

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.js';
}

if (!('speechSynthesis' in window)) {
  statut.textContent = 'La synthèse vocale n’est pas disponible dans ce navigateur.';
  btnLire.disabled = true;
  btnPause.disabled = true;
  btnStop.disabled = true;
} else {
  remplirVoix();
  speechSynthesis.onvoiceschanged = remplirVoix;
}

const NOMS_FLUIDS = ['amélie', 'thomas', 'audrey', 'hortense', 'léa', 'alice', 'manon', 'chantal', 'emma', 'daniel', 'bruno', 'léonore'];

function scoreVoix(v) {
  const n = (v.name + ' ' + (v.lang || '')).toLowerCase();
  if (/neural|premium|natural|polyglot|enhanced|\bhd\b/.test(n)) return 3;
  if (NOMS_FLUIDS.some(m => n.includes(m))) return 2;
  return 1;
}

function remplirVoix() {
  const voix = speechSynthesis.getVoices();
  if (!voix.length) return;
  selectVoix.innerHTML = '';
  const fr = voix.filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
  const autres = voix.filter(v => !(v.lang && v.lang.toLowerCase().startsWith('fr')));
  fr.sort((a, b) => scoreVoix(b) - scoreVoix(a) || (b.default ? 1 : 0) - (a.default ? 1 : 0));
  const ordonnees = [...fr, ...autres];
  for (const v of ordonnees) {
    const opt = document.createElement('option');
    opt.value = v.name;
    const score = scoreVoix(v);
    opt.textContent = `${v.name} (${v.lang})${score >= 2 ? ' ✨' : ''}${v.default ? ' — par défaut' : ''}`;
    selectVoix.appendChild(opt);
  }
  const preferee = fr[0] || ordonnees.find(v => v.default) || voix[0];
  selectVoix.value = preferee.name;
}

function voixChoisie() {
  return speechSynthesis.getVoices().find(v => v.name === selectVoix.value);
}

function dire(texte) {
  if (!texte || !texte.trim()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  const v = voixChoisie();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = 'fr-FR';
  }
  u.rate = parseFloat(vitesse.value);
  u.pitch = parseFloat(hauteur.value);
  u.onstart = () => {
    statut.textContent = 'Lecture en cours…';
    btnPause.textContent = '⏸ Pause';
  };
  u.onend = () => {
    statut.textContent = 'Lecture terminée.';
    btnPause.textContent = '⏸ Pause';
  };
  u.onerror = () => {
    statut.textContent = 'Erreur de lecture.';
  };
  speechSynthesis.speak(u);
}

function lancerSiAuto() {
  if (!auto.checked) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => dire(textArea.value), 350);
}

textArea.addEventListener('input', lancerSiAuto);
textArea.addEventListener('paste', () => setTimeout(lancerSiAuto, 0));

btnLire.addEventListener('click', () => {
  clearTimeout(debounceTimer);
  dire(textArea.value);
});

btnPause.addEventListener('click', () => {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    statut.textContent = 'En pause.';
    btnPause.textContent = '▶ Reprendre';
  } else if (speechSynthesis.paused) {
    speechSynthesis.resume();
    statut.textContent = 'Lecture en cours…';
    btnPause.textContent = '⏸ Pause';
  }
});

btnStop.addEventListener('click', () => {
  clearTimeout(debounceTimer);
  speechSynthesis.cancel();
  statut.textContent = 'Lecture arrêtée.';
  btnPause.textContent = '⏸ Pause';
});

btnEffacer.addEventListener('click', () => {
  clearTimeout(debounceTimer);
  speechSynthesis.cancel();
  textArea.value = '';
  statut.textContent = 'Texte effacé.';
  btnPause.textContent = '⏸ Pause';
  textArea.focus();
});

vitesse.addEventListener('input', () => {
  vitesseVal.textContent = parseFloat(vitesse.value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
});

hauteur.addEventListener('input', () => {
  hauteurVal.textContent = parseFloat(hauteur.value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
});

async function extraireTextePdf(fichier) {
  const data = await fichier.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const morceaux = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const contenu = await page.getTextContent();
    morceaux.push(contenu.items.map(it => it.str).join(' '));
  }
  return morceaux.join('\n\n');
}

const EXT_TEXTE = ['.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.xml', '.yml', '.yaml', '.html', '.htm', '.log', '.ini', '.svg'];

function estPdf(f) {
  return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
}

function estTexte(f) {
  return (f.type && f.type.startsWith('text/')) || EXT_TEXTE.some(e => f.name.toLowerCase().endsWith(e));
}

async function chargerFichiers(fichiers) {
  const pris = Array.from(fichiers).filter(f => estPdf(f) || estTexte(f));
  if (!pris.length) {
    statut.textContent = 'Format non pris en charge (PDF ou fichier texte).';
    return;
  }
  statut.textContent = 'Lecture du fichier…';
  try {
    const textes = [];
    for (const f of pris) {
      if (estPdf(f)) {
        if (!window.pdfjsLib) {
          statut.textContent = 'La librairie PDF n’a pas pu être chargée.';
          return;
        }
        textes.push(await extraireTextePdf(f));
      } else {
        textes.push(await f.text());
      }
    }
    textArea.value = textes.join('\n\n');
    statut.textContent = `Texte chargé depuis ${pris.length} fichier(s).`;
    lancerSiAuto();
  } catch (e) {
    statut.textContent = 'Lecture du fichier impossible : ' + (e && e.message ? e.message : e);
  }
}

inputFichier.addEventListener('change', () => {
  chargerFichiers(inputFichier.files);
  inputFichier.value = '';
});

textArea.addEventListener('dragover', e => e.preventDefault());
textArea.addEventListener('drop', e => {
  e.preventDefault();
  chargerFichiers(e.dataTransfer.files);
});
