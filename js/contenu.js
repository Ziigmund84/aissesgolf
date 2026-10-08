/* Les Aisses Golf — chargement des contenus modifiables depuis l'administration.
   Lit Supabase (lecture seule) et remplace dans la page : photos de l'accueil, PDF du restaurant,
   tarifs, hébergements et galerie. En cas d'absence de configuration ou d'erreur réseau,
   la page garde son contenu d'origine. main.js attend window.AISSES_CONTENU avant de démarrer. */
(function () {
  "use strict";
  var cfg = window.AISSES_CONFIG || {};
  var EN = (document.documentElement.lang || "fr").slice(0, 2) === "en";
  // Racine du site (fonctionne depuis / et depuis /en/)
  var script = document.currentScript;
  var RACINE = script ? new URL("../", script.src).href : "";

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) { window.AISSES_CONTENU = Promise.resolve(null); return; }

  var api = cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/";
  var entetes = { apikey: cfg.supabaseAnonKey, Authorization: "Bearer " + cfg.supabaseAnonKey };
  var lire = function (chemin) {
    return fetch(api + chemin, { headers: entetes }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  };
  var url = function (chemin) { return /^https?:\/\//.test(chemin) ? chemin : RACINE + chemin.replace(/^\//, ""); };
  var esc = function (t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var euros = function (n) { return n + " €"; };

  var delai = new Promise(function (_, refus) { setTimeout(function () { refus(new Error("délai")); }, 4000); });

  window.AISSES_CONTENU = Promise.race([Promise.all([
    lire("slides?select=image,parcours&order=ordre.asc"),
    lire("hebergements?select=nom,etiquette_fr,etiquette_en,lien,image&order=ordre.asc"),
    lire("medias?select=image,legende_fr,legende_en,video&order=ordre.asc"),
    lire("reglages?select=cle,valeur")
  ]), delai]).then(function (res) {
    var slides = res[0], hebergements = res[1], medias = res[2], reglages = {};
    res[3].forEach(function (r) { reglages[r.cle] = r.valeur; });
    var pret = function (fn) {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn();
    };
    return new Promise(function (ok) { pret(function () {
      try {
        // Accueil
        var accueil = document.querySelector("[data-slides]");
        if (accueil && slides.length) {
          Array.prototype.forEach.call(accueil.querySelectorAll(".slide"), function (s) { s.remove(); });
          var voile = accueil.querySelector(".accueil-voile");
          slides.forEach(function (s, i) {
            var d = document.createElement("div");
            d.className = "slide" + (i === 0 ? " is-active" : "");
            d.setAttribute("data-parcours", s.parcours);
            d.innerHTML = '<img class="img-cover" src="' + esc(url(s.image)) + '" alt="' +
              esc(EN ? "The " + s.parcours + " course" : "Le parcours " + s.parcours) + '"' + (i ? ' loading="lazy"' : "") + ">";
            accueil.insertBefore(d, voile);
          });
        }
        // PDF du restaurant
        var pdf = reglages.pdf || {};
        Array.prototype.forEach.call(document.querySelectorAll("[data-pdf]"), function (a) {
          var v = pdf[a.getAttribute("data-pdf")];
          if (v) a.href = url(v);
        });
        // Tarifs
        var t = reglages.tarifs;
        if (t) Array.prototype.forEach.call(document.querySelectorAll("[data-prix]"), function (td) {
          var k = td.getAttribute("data-prix").split("-");
          var v = t[k[0]] && t[k[0]][k[1]] && t[k[0]][k[1]][k[2]];
          if (v !== undefined && v !== null && v !== "") td.textContent = euros(v);
        });
        // Hébergements
        var rail = document.querySelector("[data-hebergements]");
        if (rail && hebergements.length) {
          rail.innerHTML = hebergements.map(function (h) {
            var etiquette = EN ? (h.etiquette_en || h.etiquette_fr) : h.etiquette_fr;
            return '<a href="' + esc(h.lien || "#") + '"><img class="img-cover" src="' + esc(url(h.image)) + '" alt="' + esc(h.nom) +
              '" loading="lazy"><div class="voile"></div><div class="texte"><span class="kick">' + esc(etiquette) +
              '</span><div class="org">' + esc(h.nom) + "</div></div></a>";
          }).join("");
        }
        // Galerie
        var galerie = document.querySelector("[data-galerie]");
        if (galerie && medias.length) {
          var agrandir = EN ? "Enlarge: " : "Agrandir : ";
          galerie.innerHTML = medias.map(function (m) {
            var leg = EN ? (m.legende_en || m.legende_fr) : m.legende_fr;
            var video = m.video ? ' data-video="' + esc(url(m.video)) + '"' : "";
            var lecture = m.video ? '<span class="lecture"><span><svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M8 5v14l11-7z"/></svg></span><span class="kick">' + esc(leg) + "</span></span>" : "";
            return '<li><button type="button" class="tuile' + (m.video ? " video" : "") + '" data-src="' + esc(url(m.image)) + '" data-legende="' + esc(leg) + '"' + video +
              ' aria-label="' + esc(agrandir + leg) + '"><img src="' + esc(url(m.image)) + '" alt="" loading="lazy">' + lecture + "</button></li>";
          }).join("");
        }
      } catch (e) { if (window.console) console.warn("Contenus administrables non appliqués :", e); }
      ok(true);
    }); });
  }).catch(function (e) {
    if (window.console) console.warn("Contenus administrables indisponibles, contenu d'origine affiché :", e);
    return null;
  });
})();
