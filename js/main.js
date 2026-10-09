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
    trou: "Hole", trous: "holes", repere: "Tee", aller: "Front nine", retour: "Back nine", total: "Total", hcp: "Stroke index", m: "m", par: "Par", distance: "Distance", tousReperes: "All tees", voirTrou: "Show hole", precedent: "Previous hole", suivant: "Next hole", reperes: ["Red", "Blue", "Yellow", "White", "Black"]
  } : {
    fermeMardi: "Fermé le mardi", ouvertJusqua: "Ouvert aujourd\u2019hui jusqu\u2019à ", ouvreA: "Ouvre aujourd\u2019hui à ",
    fermeDemain: "Fermé · réouvre demain", menu: "Menu", fermer: "Fermer", parcours: "Parcours", photo: "Photo",
    trou: "Trou", trous: "trous", repere: "Repère", aller: "Aller", retour: "Retour", total: "Total", hcp: "Handicap", m: "m", par: "Par", distance: "Distance", tousReperes: "Tous les repères", voirTrou: "Voir le trou", precedent: "Trou précédent", suivant: "Trou suivant", reperes: ["Rouge", "Bleu", "Jaune", "Blanc", "Noir"]
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

  /* ---------- Mentions légales / crédits : ouvrir le volet visé par le lien ---------- */
  function ouvrirVolet() {
    var cible = location.hash && document.getElementById(location.hash.slice(1));
    if (cible && cible.tagName === "DETAILS") cible.open = true;
  }
  window.addEventListener("hashchange", ouvrirVolet);
  document.querySelectorAll('a[href="#mentions"], a[href="#credits"]').forEach(function (a) {
    a.addEventListener("click", function () {
      var d = document.getElementById(a.getAttribute("href").slice(1));
      if (d) d.open = true;
    });
  });
  ouvrirVolet();

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
  // Couleur de chaque repère, dans l'ordre des lignes de dist (repère 1 à 5).
  // bord : contour visible sur fond sombre (utile pour le noir).
  var REPERES = [
    { c: "#C8102E", bord: "#C8102E" },
    { c: "#2F6FD0", bord: "#2F6FD0" },
    { c: "#F2C230", bord: "#F2C230" },
    { c: "#F4F4F4", bord: "#F4F4F4" },
    { c: "#050505", bord: "#8A8A8A" }
  ];
  var couleur = function (k) { return "--rep:" + REPERES[k].c + ";--rep-bord:" + REPERES[k].bord; };
  (function () {
    var racine = document.querySelector("[data-scorecard]");
    if (!racine) return;
    var elOnglets = document.querySelector("[data-sc-parcours]");
    var elReperes = document.querySelector("[data-sc-reperes]");
    var elDetail = document.querySelector("[data-sc-detail]");
    var elGraph = document.querySelector("[data-sc-graph]");
    var elTotaux = document.querySelector("[data-sc-totaux]");
    var elTable = document.querySelector("[data-sc-table]");
    var etat = { parcours: "aisses", repere: 0, trou: 0 };
    var MAX = 560; // échelle des barres (mètres)
    var somme = function (a, d, f) { var t = 0; for (var i = d; i < f; i++) t += a[i]; return t; };
    var nb = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, EN ? "," : " "); };
    var esc = function (t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };

    // Onglets parcours
    Object.keys(PARCOURS).forEach(function (cle) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "tab");
      b.textContent = PARCOURS[cle].nom + " · " + PARCOURS[cle].par.length;
      b.addEventListener("click", function () { etat.parcours = cle; etat.trou = 0; rendre(true); });
      b.dataset.cle = cle;
      elOnglets.appendChild(b);
    });
    // Repères 1 à 5
    for (var r = 0; r < 5; r++) (function (r) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "radio");
      b.setAttribute("style", couleur(r));
      b.innerHTML = '<i class="pastille" aria-hidden="true"></i><span class="r-nom">' + T.reperes[r] + '</span><span class="r-num">' + T.repere + " " + (r + 1) + '</span><span class="r-dist org"></span>';
      b.setAttribute("aria-label", T.repere + " " + (r + 1) + " · " + T.reperes[r]);
      b.addEventListener("click", function () { etat.repere = r; rendre(false); });
      elReperes.appendChild(b);
    })(r);

    // Trou précédent / suivant
    elDetail.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sc-pas]");
      if (!b) return;
      var n = PARCOURS[etat.parcours].par.length;
      etat.trou = (etat.trou + Number(b.getAttribute("data-sc-pas")) + n) % n;
      rendre(false);
      var meme = elDetail.querySelector('[data-sc-pas="' + b.getAttribute("data-sc-pas") + '"]');
      if (meme) meme.focus();
    });

    // Navigation clavier dans le graphique
    elGraph.addEventListener("keydown", function (e) {
      var n = PARCOURS[etat.parcours].par.length;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        etat.trou = (etat.trou + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
        rendre(false);
        var cible = elGraph.querySelectorAll(".barre")[etat.trou];
        if (cible) cible.focus();
      }
    });

    function rendre(reconstruire) {
      var P = PARCOURS[etat.parcours], n = P.par.length, d = P.dist[etat.repere], i = etat.trou;
      Array.prototype.forEach.call(elOnglets.children, function (b) {
        var on = b.dataset.cle === etat.parcours; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on);
      });
      Array.prototype.forEach.call(elReperes.children, function (b, k) {
        var on = k === etat.repere; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on);
        b.querySelector(".r-dist").innerHTML = nb(somme(P.dist[k], 0, n)) + " <small>" + T.m + "</small>";
      });
      racine.closest(".score").setAttribute("style", couleur(etat.repere));

      // Détail du trou
      var lignes = P.dist.map(function (row, k) {
        return '<li class="' + (k === etat.repere ? "is-on" : "") + '" style="' + couleur(k) + '"><i class="pastille" aria-hidden="true"></i><span>' + T.reperes[k] + '</span><span class="sc-jauge"><i style="width:' + (row[i] / MAX * 100) + '%"></i></span><b>' + row[i] + " " + T.m + "</b></li>";
      }).join("");
      elDetail.innerHTML =
        '<div class="sc-haut"><p class="kick">' + esc(P.nom) + " · " + T.trou + '</p><div class="sc-pas">' +
        '<button type="button" data-sc-pas="-1" aria-label="' + T.precedent + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<button type="button" data-sc-pas="1" aria-label="' + T.suivant + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg></button></div></div>' +
        '<div class="sc-num org">' + (i + 1) + '<span>/ ' + n + "</span></div>" +
        '<div class="sc-infos"><div><span class="org">' + P.par[i] + '</span><span class="kick">' + T.par + '</span></div>' +
        '<div><span class="org">' + P.hcp[i] + '</span><span class="kick">' + T.hcp + '</span></div>' +
        '<div class="sc-dist"><span class="org">' + d[i] + ' <small>' + T.m + '</small></span><span class="kick"><i class="pastille" aria-hidden="true"></i>' + T.reperes[etat.repere] + "</span></div></div>" +
        '<p class="kick sc-sous">' + T.tousReperes + '</p><ul class="sc-reperes">' + lignes + "</ul>";

      // Graphique : une barre par trou, hauteur = distance
      if (reconstruire || elGraph.children.length !== n + (n === 18 ? 1 : 0)) {
        elGraph.innerHTML = "";
        elGraph.classList.remove("is-vu");
        for (var k = 0; k < n; k++) (function (k) {
          if (n === 18 && k === 9) { var sep = document.createElement("span"); sep.className = "sc-sep"; sep.setAttribute("aria-hidden", "true"); elGraph.appendChild(sep); }
          var b = document.createElement("button");
          b.type = "button"; b.className = "barre";
          b.style.setProperty("--i", k);
          b.innerHTML = '<span class="b-col"><span class="b-fill"><span class="b-dist"></span></span></span><span class="b-num org">' + (k + 1) + '</span><span class="b-par">' + T.par + " " + P.par[k] + "</span>";
          b.addEventListener("click", function () { etat.trou = k; rendre(false); });
          b.addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover)").matches) { etat.trou = k; rendre(false); } });
          elGraph.appendChild(b);
        })(k);
        requestAnimationFrame(function () { requestAnimationFrame(function () { if (vu) elGraph.classList.add("is-vu"); }); });
      }
      Array.prototype.forEach.call(elGraph.querySelectorAll(".barre"), function (b, k) {
        b.classList.toggle("is-on", k === i);
        b.setAttribute("aria-label", T.voirTrou + " " + (k + 1) + " · " + T.par + " " + P.par[k] + " · " + d[k] + " " + T.m);
        b.tabIndex = k === i ? 0 : -1;
        b.querySelector(".b-fill").style.height = (d[k] / MAX * 100) + "%";
        b.querySelector(".b-dist").textContent = d[k];
      });

      // Totaux
      var blocs = n === 18 ? [[T.aller, 0, 9], [T.retour, 9, 18], [T.total, 0, 18]] : [[T.total, 0, n]];
      elTotaux.innerHTML = blocs.map(function (bl) {
        return '<div><span class="kick">' + bl[0] + '</span><span class="org">' + nb(somme(d, bl[1], bl[2])) + ' <small>' + T.m + '</small></span><span class="sc-par">' + T.par + " " + somme(P.par, bl[1], bl[2]) + "</span></div>";
      }).join("");

      // Tableau complet
      var cols = [];
      for (var c = 0; c < n; c++) { cols.push(c); if (n === 18 && c === 8) cols.push("A"); }
      if (n === 18) cols.push("R");
      cols.push("T");
      var cell = function (row, c, montrerSomme) {
        if (c === "A") return montrerSomme ? somme(row, 0, 9) : "";
        if (c === "R") return montrerSomme ? somme(row, 9, 18) : "";
        if (c === "T") return montrerSomme ? somme(row, 0, n) : "";
        return row[c];
      };
      var tete = "<tr><th scope=\"col\">" + T.trou + "</th>" + cols.map(function (c) {
        var lab = c === "A" ? T.aller : c === "R" ? T.retour : c === "T" ? T.total : c + 1;
        return '<th scope="col"' + (typeof c === "string" ? ' class="tot"' : "") + ">" + lab + "</th>";
      }).join("") + "</tr>";
      var ligne = function (nom, row, s, cls) {
        return '<tr class="' + (cls || "") + '"><th scope="row">' + nom + "</th>" + cols.map(function (c) {
          return "<td" + (typeof c === "string" ? ' class="tot"' : "") + ">" + cell(row, c, s) + "</td>";
        }).join("") + "</tr>";
      };
      var corps = ligne(T.par, P.par, true, "l-par") + ligne(T.hcp, P.hcp, false, "l-hcp") +
        P.dist.map(function (row, k) { return ligne('<i class="pastille" style="' + couleur(k) + '" aria-hidden="true"></i>' + T.reperes[k], row, true, k === etat.repere ? "is-on" : ""); }).join("");
      elTable.innerHTML = "<table><caption class=\"sr-only\">" + esc(P.nom) + "</caption><thead>" + tete + "</thead><tbody>" + corps + "</tbody></table>";
    }

    // Les barres poussent quand la section arrive à l'écran
    var vu = !("IntersectionObserver" in window);
    if (!vu) {
      new IntersectionObserver(function (entrees, obs) {
        entrees.forEach(function (e) { if (e.isIntersecting) { vu = true; elGraph.classList.add("is-vu"); obs.disconnect(); } });
      }, { threshold: 0.25 }).observe(elGraph);
    }
    rendre(true);
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
