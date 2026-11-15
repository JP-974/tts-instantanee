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
const inputPdf = document.getElementById('fichier-pdf');

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

function remplirVoix() {
  const voix = speechSynthesis.getVoices();
  if (!voix.length) return;
  selectVoix.innerHTML = '';
  const fr = voix.filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
  const autres = voix.filter(v => !(v.lang && v.lang.toLowerCase().startsWith('fr')));
  const ordonnees = [...fr, ...autres];
  for (const v of ordonnees) {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})${v.default ? ' — par défaut' : ''}`;
    selectVoix.appendChild(opt);
  }
  const preferee = ordonnees.find(v => v.default) || fr[0] || voix[0];
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

async function chargerPdfs(fichiers) {
  const pdfs = Array.from(fichiers).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  if (!pdfs.length) {
    statut.textContent = 'Aucun fichier PDF sélectionné.';
    return;
  }
  if (!window.pdfjsLib) {
    statut.textContent = 'La librairie PDF n’a pas pu être chargée.';
    return;
  }
  statut.textContent = 'Extraction du texte…';
  try {
    const textes = [];
    for (const f of pdfs) {
      textes.push(await extraireTextePdf(f));
    }
    textArea.value = textes.join('\n\n');
    statut.textContent = `Texte extrait de ${pdfs.length} PDF.`;
    lancerSiAuto();
  } catch (e) {
    statut.textContent = 'Lecture du PDF impossible : ' + (e && e.message ? e.message : e);
  }
}

inputPdf.addEventListener('change', () => {
  chargerPdfs(inputPdf.files);
  inputPdf.value = '';
});

textArea.addEventListener('dragover', e => e.preventDefault());
textArea.addEventListener('drop', e => {
  e.preventDefault();
  chargerPdfs(e.dataTransfer.files);
});
