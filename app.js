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

let debounceTimer = null;

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
