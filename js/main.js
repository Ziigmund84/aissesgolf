/* Les Aisses Golf — scripts du site (aucune dépendance) */
(function () {
  "use strict";

  // Attend les contenus de l'administration (js/contenu.js), au plus 4,5 secondes
  var lance = false;
  function demarrerUneFois() { if (!lance) { lance = true; demarrer(); } }
  if (window.AISSES_CONTENU && window.AISSES_CONTENU.then) {
    window.AISSES_CONTENU.then(demarrerUneFois, demarrerUneFois);
    setTimeout(demarrerUneFois, 4500);
  } else {
    demarrerUneFois();
  }

  function demarrer() {

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

  /* ---------- Textes selon la langue de la page (<html lang>) ---------- */
  var EN = (document.documentElement.lang || "fr").slice(0, 2) === "en";
  var T = EN ? {
    fermeMardi: "Closed on Tuesdays", ouvertJusqua: "Open today until ", ouvreA: "Opens today at ",
    fermeDemain: "Closed · reopens tomorrow", menu: "Menu", fermer: "Close", parcours: "Course", photo: "Photo",
    trou: "Hole", aller: "Front nine", retour: "Back nine", out: "Out", in_: "In", total: "Total", hcp: "Stroke index", m: "m", par: "Par", depart: "Tee",
    couleurs: ["Black", "White", "Yellow", "Blue", "Red"]
  } : {
    fermeMardi: "Fermé le mardi", ouvertJusqua: "Ouvert aujourd\u2019hui jusqu\u2019à ", ouvreA: "Ouvre aujourd\u2019hui à ",
    fermeDemain: "Fermé · réouvre demain", menu: "Menu", fermer: "Fermer", parcours: "Parcours", photo: "Photo",
    trou: "Trou", aller: "Aller", retour: "Retour", out: "Aller", in_: "Retour", total: "Total", hcp: "Handicap", m: "m", par: "Par", depart: "Départ",
    couleurs: ["Noir", "Blanc", "Jaune", "Bleu", "Rouge"]
  };
  // Heures : 8h30 en français, 8:30am en anglais
  var fmt = function (m) {
    var h = Math.floor(m / 60), r = m % 60;
    if (EN) { var hh = h % 12 || 12; return hh + (r ? ":" + (r < 10 ? "0" + r : r) : "") + (h < 12 ? "am" : "pm"); }
    return h + "h" + (r ? (r < 10 ? "0" + r : r) : "");
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
    var ouvert = jour !== 2 && min >= plage[0] && min < plage[1];
    var texte = jour === 2 ? T.fermeMardi
      : ouvert ? T.ouvertJusqua + fmt(plage[1])
      : min < plage[0] ? T.ouvreA + fmt(plage[0])
      : T.fermeDemain;
    statut.querySelector("span").textContent = texte;
    statut.classList.toggle("ouvert", ouvert);
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector("[data-burger]");
  var entete = document.querySelector(".entete");
  if (burger && entete) {
    var fermer = function () { entete.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); burger.textContent = T.menu; };
    burger.addEventListener("click", function () {
      var ouvert = entete.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", ouvert ? "true" : "false");
      burger.textContent = ouvert ? T.fermer : T.menu;
    });
    entete.querySelectorAll(".nav a").forEach(function (a) { a.addEventListener("click", fermer); });
  }

  /* ---------- Mentions légales / crédits : fenêtres au centre de l'écran ---------- */
  function ouvrirModale(id) {
    var m = document.getElementById(id);
    if (!m || m.tagName !== "DIALOG" || m.open) return;
    if (typeof m.showModal === "function") m.showModal(); else m.setAttribute("open", "");
    document.body.classList.add("modale-ouverte");
  }
  Array.prototype.forEach.call(document.querySelectorAll("dialog.modale"), function (m) {
    var fermer = function () { if (m.open) m.close(); };
    m.addEventListener("close", function () {
      document.body.classList.remove("modale-ouverte");
      if (location.hash === "#" + m.id) history.replaceState(null, "", location.pathname + location.search);
    });
    m.addEventListener("click", function (e) { if (e.target === m) fermer(); });
    Array.prototype.forEach.call(m.querySelectorAll("[data-modale-fermer]"), function (b) { b.addEventListener("click", fermer); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#mentions"], a[href="#credits"]'), function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); ouvrirModale(a.getAttribute("href").slice(1)); });
  });
  if (location.hash === "#mentions" || location.hash === "#credits") ouvrirModale(location.hash.slice(1));

  /* ---------- Vagues de l'accueil : immobiles si l'utilisateur limite les animations ---------- */
  var vagues = document.querySelector(".vagues svg");
  if (vagues && window.matchMedia("(prefers-reduced-motion: reduce)").matches && vagues.pauseAnimations) vagues.pauseAnimations();

  /* ---------- Carte de score interactive ----------
     Distances en mètres, du repère 1 (le plus long) au repère 5. */
  var PARCOURS = {
    aisses: {
      nom: "Les Aisses",
      par: [5,4,3,4,4,5,3,4,4, 3,4,5,4,4,5,4,3,4],
      hcp: [17,5,9,7,1,15,11,13,3, 16,2,10,8,6,18,14,12,4],
      dist: [
        [481,370,182,391,386,502,176,426,409, 157,402,520,379,396,511,374,208,403],
        [467,352,177,377,369,477,158,347,385, 144,387,477,347,368,486,344,188,368],
        [454,332,168,362,349,454,137,322,374, 131,363,455,315,336,434,322,166,347],
        [430,292,141,339,321,431,116,298,334, 131,341,432,266,308,404,300,166,327],
        [405,256,101,315,301,400,101,275,304, 91,318,411,241,284,386,283,136,306]
      ]
    },
    canne: {
      nom: "La Canne",
      par: [4,4,4,3,4,5,4,5,3],
      hcp: [3,13,15,5,11,7,9,1,17],
      dist: [
        [419,323,305,198,392,521,392,545,169],
        [383,323,305,178,369,499,367,518,163],
        [353,294,282,156,310,452,330,486,139],
        [300,271,254,156,300,438,315,460,139],
        [272,254,234,137,291,408,294,414,115]
      ]
    }
  };
  // Couleur des boules de départ, du plus long au plus court (même ordre que dist)
  var BOULES = ["#161616", "#F4F4F2", "#E9C22E", "#2F6FD0", "#D2363A"];

  (function () {
    var elOnglets = document.querySelector("[data-sc-parcours]");
    var elBoules = document.querySelector("[data-sc-boules]");
    var elTable = document.querySelector("[data-sc-table]");
    if (!elOnglets || !elBoules || !elTable) return;
    var ouvrir = document.querySelector("[data-sc-ouvrir]");
    if (ouvrir) {
      var texteOuvrir = ouvrir.querySelector("[data-sc-ouvrir-texte]");
      var libelles = EN ? ["View the scorecard", "Hide the scorecard"] : ["Voir la carte de score", "Masquer la carte de score"];
      ouvrir.addEventListener("click", function () {
        var visible = elTable.hidden;
        elTable.hidden = !visible;
        ouvrir.setAttribute("aria-expanded", visible ? "true" : "false");
        texteOuvrir.textContent = libelles[visible ? 1 : 0];
      });
    }
    var etat = { parcours: "aisses", depart: 1 };
    var somme = function (a, d, f) { var t = 0; for (var i = d; i < f; i++) t += a[i]; return t; };
    var nb = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, EN ? "," : " "); };
    var boule = function (k) { return '<span class="boule" style="--c:' + BOULES[k] + '" aria-hidden="true"></span>'; };

    Object.keys(PARCOURS).forEach(function (cle) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "tab"); b.dataset.cle = cle;
      b.textContent = PARCOURS[cle].nom + " · " + PARCOURS[cle].par.length;
      b.addEventListener("click", function () { etat.parcours = cle; rendre(); });
      elOnglets.appendChild(b);
    });

    function rendre() {
      var P = PARCOURS[etat.parcours], n = P.par.length;
      Array.prototype.forEach.call(elOnglets.children, function (b) {
        var on = b.dataset.cle === etat.parcours; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on);
      });

      // Boules de départ avec la longueur totale du parcours
      elBoules.innerHTML = P.dist.map(function (row, k) {
        var on = k === etat.depart;
        return '<button type="button" role="radio" aria-checked="' + on + '" class="' + (on ? "is-on" : "") + '" data-k="' + k + '">' +
          boule(k) + '<span class="infos"><span class="nom">' + T.couleurs[k] + '</span><span class="long">' + nb(somme(row, 0, n)) + " <small>" + T.m + "</small></span></span></button>";
      }).join("");
      Array.prototype.forEach.call(elBoules.children, function (b) {
        b.addEventListener("click", function () { etat.depart = Number(b.dataset.k); rendre(); });
      });

      // Une carte de 9 trous (aller, puis retour pour les 18 trous)
      var neuf = function (titre, d, f, libTot) {
        var trous = []; for (var i = d; i < f; i++) trous.push(i);
        var ligne = function (cls, entete, row, avecTotal) {
          return '<tr class="' + cls + '"><th scope="row">' + entete + "</th>" +
            trous.map(function (i) { return "<td>" + row[i] + "</td>"; }).join("") +
            '<td class="tot">' + (avecTotal ? nb(somme(row, d, f)) : "") + "</td></tr>";
        };
        return '<div class="carte-9"><table><caption>' + titre + "</caption><thead><tr><th scope=\"col\"><span class=\"sr-only\">" + T.trou + "</span></th>" +
          trous.map(function (i) { return '<th scope="col">' + (i + 1) + "</th>"; }).join("") +
          '<th scope="col" class="tot">' + libTot + "</th></tr></thead><tbody>" +
          ligne("l-par", T.par, P.par, true) +
          ligne("l-hcp", T.hcp, P.hcp, false) +
          P.dist.map(function (row, k) {
            return ligne("l-depart" + (k === etat.depart ? " is-on" : ""), '<span class="lib">' + boule(k) + T.couleurs[k] + "</span>", row, true);
          }).join("") +
          "</tbody></table></div>";
      };
      elTable.innerHTML = n === 18
        ? neuf(P.nom + " · " + T.aller, 0, 9, T.out) + neuf(P.nom + " · " + T.retour, 9, 18, T.in_)
        : neuf(P.nom + " · 9 " + (EN ? "holes" : "trous"), 0, 9, T.total);
    }
    rendre();
  })();

  /* ---------- Médias : mosaïque + lightbox ---------- */
  (function () {
    var liste = document.querySelector("[data-galerie]");
    var lb = document.querySelector("[data-lightbox]");
    if (!liste || !lb) return;
    var originaux = Array.prototype.slice.call(liste.querySelectorAll(".tuile"));
    var RATIOS = ["4 / 5", "16 / 10", "1 / 1", "3 / 4", "16 / 9", "4 / 3", "5 / 6"];
    var TOTAL_TUILES = 24; // répétitions pour remplir toute la largeur

    // Répète les vignettes jusqu'à TOTAL_TUILES (les copies sont masquées aux lecteurs d'écran)
    for (var k = originaux.length; k < TOTAL_TUILES; k++) {
      var li = originaux[k % originaux.length].parentNode.cloneNode(true);
      li.setAttribute("aria-hidden", "true");
      li.querySelector("button").tabIndex = -1;
      liste.appendChild(li);
    }
    var tuiles = Array.prototype.slice.call(liste.querySelectorAll(".tuile"));
    tuiles.forEach(function (t, i) {
      t.style.setProperty("--ratio", RATIOS[(i * 3) % RATIOS.length]);
      t.addEventListener("click", function () { ouvrir(i % originaux.length, t); });
    });

    var zone = lb.querySelector("[data-lb-media]");
    var num = lb.querySelector("[data-lb-num]");
    var total = lb.querySelector("[data-lb-total]");
    var legende = lb.querySelector("[data-lb-legende]");
    var deux = function (n) { return (n < 10 ? "0" : "") + n; };
    var actif = 0, retour = null;
    total.textContent = "/ " + deux(originaux.length);

    function afficher(i) {
      actif = (i + originaux.length) % originaux.length;
      var t = originaux[actif];
      zone.innerHTML = "";
      var video = t.getAttribute("data-video");
      var el;
      if (video) {
        el = document.createElement("video");
        el.src = video; el.controls = true; el.autoplay = true; el.playsInline = true;
        el.poster = t.getAttribute("data-src");
      } else {
        el = document.createElement("img");
        el.src = t.getAttribute("data-src");
        el.alt = t.getAttribute("data-legende");
      }
      zone.appendChild(el);
      num.textContent = deux(actif + 1);
      legende.textContent = t.getAttribute("data-legende");
    }
    function ouvrir(i, source) {
      retour = source || null;
      lb.hidden = false;
      document.body.classList.add("lb-ouvert");
      afficher(i);
      lb.querySelector("[data-lb-fermer]").focus();
    }
    function fermer() {
      lb.hidden = true;
      zone.innerHTML = "";
      document.body.classList.remove("lb-ouvert");
      if (retour) retour.focus();
    }
    lb.querySelector("[data-lb-prec]").addEventListener("click", function () { afficher(actif - 1); });
    lb.querySelector("[data-lb-suiv]").addEventListener("click", function () { afficher(actif + 1); });
    lb.querySelector("[data-lb-fermer]").addEventListener("click", fermer);
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target === zone) fermer(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); afficher(actif - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); afficher(actif + 1); }
      else if (e.key === "Escape") fermer();
    });
    // Balayage sur mobile
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) afficher(actif + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  })();

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
    etiquette.textContent = T.parcours;
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
    b.setAttribute("aria-label", T.photo + " " + (i + 1) + " · " + slide.getAttribute("data-parcours"));
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
  }
})();
