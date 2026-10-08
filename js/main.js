/* Les Aisses Golf — scripts du site (aucune dépendance) */
(function () {
  "use strict";

  /* ---------- Horaires d'ouverture ----------
     Minutes depuis minuit : [ouverture, fermeture]. sem = lundi, mercredi à vendredi ; we = samedi et dimanche.
     Fermé tous les mardis. */
  var HORAIRES = {
    0:  { sem: [540, 1020], we: [510, 1050] }, // janvier   9h–17h / 8h30–17h30
    1:  { sem: [540, 1050], we: [510, 1050] }, // février   9h–17h30 / 8h30–17h30
    2:  { sem: [510, 1050], we: [480, 1080] }, // mars      8h30–17h30 / 8h–18h
    3:  { sem: [510, 1140], we: [480, 1170] }, // avril     8h30–19h / 8h–19h30
    4:  { sem: [510, 1140], we: [480, 1170] },
    5:  { sem: [510, 1140], we: [480, 1170] },
    6:  { sem: [510, 1140], we: [480, 1170] },
    7:  { sem: [510, 1140], we: [480, 1170] },
    8:  { sem: [510, 1140], we: [480, 1170] },
    9:  { sem: [510, 1140], we: [480, 1170] }, // octobre
    10: { sem: [540, 1050], we: [510, 1080] }, // novembre  9h–17h30 / 8h30–18h
    11: { sem: [540, 1020], we: [510, 1050] }  // décembre  9h–17h / 8h30–17h30
  };

  var maintenant = new Date();
  var mois = maintenant.getMonth();

  /* ---------- Saison en cours (tarifs) ---------- */
  document.documentElement.setAttribute("data-saison", mois >= 3 && mois <= 9 ? "haute" : "basse");

  /* ---------- Statut ouvert / fermé ---------- */
  var statut = document.querySelector("[data-statut]");
  if (statut) {
    var jour = maintenant.getDay();
    var min = maintenant.getHours() * 60 + maintenant.getMinutes();
    var plage = (jour === 0 || jour === 6) ? HORAIRES[mois].we : HORAIRES[mois].sem;
    var fmt = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + "h" + (r ? (r < 10 ? "0" + r : r) : ""); };
    var ouvert = jour !== 2 && min >= plage[0] && min < plage[1];
    var texte = jour === 2 ? "Fermé le mardi"
      : ouvert ? "Ouvert aujourd’hui jusqu’à " + fmt(plage[1])
      : min < plage[0] ? "Ouvre aujourd’hui à " + fmt(plage[0])
      : "Fermé · réouvre demain";
    statut.querySelector("span").textContent = texte;
    statut.classList.toggle("ouvert", ouvert);
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector("[data-burger]");
  var entete = document.querySelector(".entete");
  if (burger && entete) {
    var fermer = function () { entete.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); burger.textContent = "Menu"; };
    burger.addEventListener("click", function () {
      var ouvert = entete.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", ouvert ? "true" : "false");
      burger.textContent = ouvert ? "Fermer" : "Menu";
    });
    entete.querySelectorAll(".nav a").forEach(function (a) { a.addEventListener("click", fermer); });
  }

  /* ---------- Diaporama de l'accueil ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".accueil .slide"));
  var titre = document.querySelector(".accueil h1");
  var barres = document.querySelector("[data-barres]");
  var num = document.querySelector("[data-num]");
  if (!slides.length || !titre || !barres) return;

  var DUREE = 7000;
  var courant = 0, precedent = -1, minuteur = null;
  var noms = [], boutons = [];
  var deux = function (n) { return (n < 10 ? "0" : "") + n; };

  slides.forEach(function (slide, i) {
    // Nom du parcours, lettre par lettre
    var nom = document.createElement("span");
    nom.className = "nom-parcours";
    nom.setAttribute("aria-hidden", "true");
    var etiquette = document.createElement("span");
    etiquette.className = "kick";
    etiquette.textContent = "Parcours";
    var lettres = document.createElement("span");
    lettres.className = "lettres";
    slide.getAttribute("data-parcours").split("").forEach(function (c, k) {
      var s = document.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? " " : c;
      s.style.transitionDelay = (0.5 + k * 0.05) + "s";
      lettres.appendChild(s);
    });
    nom.appendChild(etiquette);
    nom.appendChild(lettres);
    titre.appendChild(nom);
    noms.push(nom);

    // Barre de pagination
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Photo " + (i + 1) + " · " + slide.getAttribute("data-parcours"));
    b.innerHTML = '<span class="piste"><span class="remplissage"></span></span>';
    b.addEventListener("click", function () { aller(i); relancer(); });
    barres.appendChild(b);
    boutons.push(b);
  });
  var total = num && num.nextElementSibling;
  if (total) total.textContent = "/ " + deux(slides.length);

  function rendre() {
    slides.forEach(function (s, i) {
      s.classList.toggle("is-active", i === courant);
      s.classList.toggle("is-prev", i === precedent);
    });
    noms.forEach(function (n, i) { n.classList.toggle("is-active", i === courant); });
    boutons.forEach(function (b, i) {
      // On retire puis remet la classe pour relancer l'animation de la barre
      b.classList.remove("is-active");
      void b.offsetWidth;
      b.classList.toggle("is-active", i === courant);
      b.classList.toggle("is-done", i < courant);
      b.setAttribute("aria-current", i === courant ? "true" : "false");
    });
    if (num) num.textContent = deux(courant + 1);
  }
  function aller(i) {
    if (i === courant) return;
    precedent = courant;
    courant = i;
    rendre();
  }
  function relancer() {
    clearInterval(minuteur);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    minuteur = setInterval(function () { aller((courant + 1) % slides.length); }, DUREE);
  }

  // Pause quand l'onglet est caché
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) clearInterval(minuteur); else relancer();
  });

  rendre();
  relancer();
})();
