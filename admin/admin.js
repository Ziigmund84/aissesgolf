/* Les Aisses Golf — administration
   Connexion Supabase (e-mail + mot de passe) puis édition des contenus :
   accueil, PDF du restaurant, tarifs, hébergements, galerie. Les changements sont en ligne immédiatement. */
(function () {
  "use strict";

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var cfg = window.AISSES_CONFIG || {};
  var BUCKET = "site";
  var vues = ["connexion", "motdepasse", "config", "app"];
  function voir(nom) { vues.forEach(function (v) { $('[data-vue="' + v + '"]').hidden = v !== nom; }); }

  // ---------- Notifications ----------
  var toastMinuteur;
  function toast(texte, erreur) {
    var t = $("[data-toast]");
    t.textContent = texte;
    t.classList.toggle("erreur", !!erreur);
    t.classList.add("visible");
    clearTimeout(toastMinuteur);
    toastMinuteur = setTimeout(function () { t.classList.remove("visible"); }, erreur ? 6000 : 2600);
  }
  function echec(e) { console.error(e); toast("Erreur : " + (e && e.message ? e.message : e), true); }

  var esc = function (t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  // Les images d'origine sont dans assets/img (chemin relatif à la racine du site)
  var apercu = function (chemin) { return /^https?:\/\//.test(chemin) ? chemin : "../" + String(chemin).replace(/^\//, ""); };

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) { voir("config"); return; }

  // Repérer une invitation ou un lien « mot de passe oublié » avant que Supabase ne nettoie l'adresse
  var lienMotDePasse = /type=(invite|recovery)/.test(location.hash);
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  // ---------- Connexion ----------
  $("[data-form-connexion]").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, msg = $("[data-message-connexion]");
    msg.className = "message"; msg.textContent = "Connexion…";
    sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }).then(function (r) {
      if (r.error) { msg.className = "message erreur"; msg.textContent = "E-mail ou mot de passe incorrect."; return; }
      f.password.value = "";
      ouvrirApp(r.data.session);
    });
  });
  $("[data-oubli]").addEventListener("click", function () {
    var f = $("[data-form-connexion]"), msg = $("[data-message-connexion]");
    var email = f.email.value.trim();
    if (!email) { msg.className = "message erreur"; msg.textContent = "Saisissez d'abord votre adresse e-mail."; f.email.focus(); return; }
    msg.className = "message"; msg.textContent = "Envoi…";
    sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] }).then(function (r) {
      if (r.error) { msg.className = "message erreur"; msg.textContent = r.error.message; return; }
      msg.className = "message ok";
      msg.textContent = "Si cette adresse est autorisée, un e-mail vient de vous être envoyé avec un lien pour choisir votre mot de passe.";
    });
  });
  $("[data-form-motdepasse]").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, msg = $("[data-message-motdepasse]");
    if (f.p1.value !== f.p2.value) { msg.className = "message erreur"; msg.textContent = "Les deux mots de passe ne correspondent pas."; return; }
    msg.className = "message"; msg.textContent = "Enregistrement…";
    sb.auth.updateUser({ password: f.p1.value }).then(function (r) {
      if (r.error) { msg.className = "message erreur"; msg.textContent = r.error.message; return; }
      f.reset(); lienMotDePasse = false;
      toast("Mot de passe enregistré.");
      sb.auth.getSession().then(function (s) { ouvrirApp(s.data.session); });
    });
  });
  $("[data-deconnexion]").addEventListener("click", function () { sb.auth.signOut().then(function () { voir("connexion"); }); });

  sb.auth.onAuthStateChange(function (evenement) {
    if (evenement === "PASSWORD_RECOVERY") { lienMotDePasse = true; voir("motdepasse"); }
  });
  sb.auth.getSession().then(function (r) {
    var session = r.data.session;
    if (session && lienMotDePasse) voir("motdepasse");
    else if (session) ouvrirApp(session);
    else voir("connexion");
  });

  function ouvrirApp(session) {
    if (!session) { voir("connexion"); return; }
    sb.rpc("est_admin").then(function (r) {
      if (r.error || !r.data) {
        sb.auth.signOut();
        voir("connexion");
        var msg = $("[data-message-connexion]");
        msg.className = "message erreur";
        msg.textContent = "Ce compte n'a pas accès à l'administration.";
        return;
      }
      $("[data-qui]").textContent = session.user.email;
      voir("app");
      afficher(ongletCourant);
    });
  }

  // ---------- Onglets ----------
  var ongletCourant = "accueil";
  Array.prototype.forEach.call(document.querySelectorAll("[data-onglet]"), function (b) {
    b.addEventListener("click", function () { afficher(b.getAttribute("data-onglet")); });
  });
  function afficher(nom) {
    ongletCourant = nom;
    Array.prototype.forEach.call(document.querySelectorAll("[data-onglet]"), function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-onglet") === nom);
    });
    var p = $("[data-panneau]");
    p.innerHTML = '<p class="chargement">Chargement…</p>';
    ({ accueil: vueAccueil, restaurant: vueRestaurant, tarifs: vueTarifs, parcours: vueParcours, sejour: vueSejour, medias: vueMedias })[nom](p);
  }

  // ---------- Fichiers ----------
  // Réduit et convertit les photos (WebP, ou JPEG si le navigateur ne sait pas faire de WebP)
  function preparerImage(fichier, largeurMax) {
    return new Promise(function (ok, ko) {
      var img = new Image();
      var lien = URL.createObjectURL(fichier);
      img.onload = function () {
        var ratio = Math.min(1, largeurMax / img.naturalWidth);
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * ratio);
        c.height = Math.round(img.naturalHeight * ratio);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(lien);
        c.toBlob(function (b) {
          if (b && b.type === "image/webp") return ok({ blob: b, ext: "webp" });
          c.toBlob(function (j) { j ? ok({ blob: j, ext: "jpg" }) : ko(new Error("Image illisible")); }, "image/jpeg", 0.85);
        }, "image/webp", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(lien); ko(new Error("Ce fichier n'est pas une image lisible.")); };
      img.src = lien;
    });
  }
  function nomFichier(dossier, ext) {
    return dossier + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
  }
  function envoyer(chemin, blob, type) {
    return sb.storage.from(BUCKET).upload(chemin, blob, { contentType: type, upsert: false, cacheControl: "31536000" }).then(function (r) {
      if (r.error) throw r.error;
      return sb.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
    });
  }
  function envoyerImage(fichier, dossier, largeurMax) {
    return preparerImage(fichier, largeurMax).then(function (p) {
      return envoyer(nomFichier(dossier, p.ext), p.blob, p.ext === "webp" ? "image/webp" : "image/jpeg");
    });
  }
  // Supprime le fichier du stockage s'il en vient (les images d'origine de assets/ ne sont pas touchées)
  function supprimerFichier(url) {
    var marque = "/storage/v1/object/public/" + BUCKET + "/";
    var i = url ? url.indexOf(marque) : -1;
    if (i < 0) return Promise.resolve();
    return sb.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marque.length))]).then(function () {});
  }
  function choisirFichiers(accept, multiple) {
    return new Promise(function (ok) {
      var input = document.createElement("input");
      input.type = "file"; input.accept = accept; input.multiple = !!multiple;
      input.addEventListener("change", function () { ok(Array.prototype.slice.call(input.files || [])); });
      input.click();
    });
  }

  // ---------- Base de données ----------
  function lireTable(table) {
    return sb.from(table).select("*").order("ordre", { ascending: true }).then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function maj(table, id, champs) {
    return sb.from(table).update(champs).eq("id", id).then(function (r) { if (r.error) throw r.error; });
  }
  function enregistrerOrdre(table, ids) {
    return Promise.all(ids.map(function (id, i) { return maj(table, id, { ordre: i + 1 }); }));
  }

  // Bouton supprimer en deux temps (pas de fenêtre de confirmation)
  function boutonSupprimer(action) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn danger"; b.textContent = "Supprimer";
    var arme = null;
    b.addEventListener("click", function () {
      if (!arme) {
        b.classList.add("confirmer"); b.textContent = "Confirmer ?";
        arme = setTimeout(function () { b.classList.remove("confirmer"); b.textContent = "Supprimer"; arme = null; }, 3500);
        return;
      }
      clearTimeout(arme); b.disabled = true; b.textContent = "Suppression…";
      action();
    });
    return b;
  }

  // Liste réordonnable : glisser-déposer + flèches ↑ ↓ (souris, tactile et clavier)
  function listeOrdonnable(conteneur, table, lignes, rendreElement, apresChangement) {
    conteneur.innerHTML = "";
    var glisse = null;
    lignes.forEach(function (ligne, index) {
      var el = rendreElement(ligne, index);
      el.classList.add("element");
      el.dataset.id = ligne.id;
      el.draggable = true;
      var poignee = document.createElement("span");
      poignee.className = "poignee"; poignee.textContent = "⠿"; poignee.title = "Glisser pour déplacer";
      poignee.setAttribute("aria-hidden", "true");
      el.insertBefore(poignee, el.firstChild);
      var actions = el.querySelector(".actions");
      var haut = document.createElement("button"), bas = document.createElement("button");
      haut.type = bas.type = "button";
      haut.className = bas.className = "btn icone";
      haut.textContent = "↑"; bas.textContent = "↓";
      haut.setAttribute("aria-label", "Monter"); bas.setAttribute("aria-label", "Descendre");
      haut.disabled = index === 0; bas.disabled = index === lignes.length - 1;
      haut.addEventListener("click", function () { deplacer(index, index - 1); });
      bas.addEventListener("click", function () { deplacer(index, index + 1); });
      actions.insertBefore(bas, actions.firstChild);
      actions.insertBefore(haut, actions.firstChild);
      el.addEventListener("dragstart", function (e) {
        if (e.target.closest("input, select, textarea")) { e.preventDefault(); return; }
        glisse = el; el.classList.add("glisse"); e.dataTransfer.effectAllowed = "move";
      });
      el.addEventListener("dragend", function () { el.classList.remove("glisse"); glisse = null; });
      el.addEventListener("dragover", function (e) { if (glisse && glisse !== el) { e.preventDefault(); el.classList.add("cible"); } });
      el.addEventListener("dragleave", function () { el.classList.remove("cible"); });
      el.addEventListener("drop", function (e) {
        e.preventDefault(); el.classList.remove("cible");
        if (!glisse || glisse === el) return;
        var ids = Array.prototype.map.call(conteneur.children, function (c) { return c.dataset.id; });
        deplacer(ids.indexOf(glisse.dataset.id), ids.indexOf(el.dataset.id));
      });
      conteneur.appendChild(el);
    });
    function deplacer(de, vers) {
      if (vers < 0 || vers >= lignes.length || de === vers) return;
      var copie = lignes.slice();
      var item = copie.splice(de, 1)[0];
      copie.splice(vers, 0, item);
      enregistrerOrdre(table, copie.map(function (l) { return l.id; }))
        .then(function () { toast("Ordre enregistré."); apresChangement(); })
        .catch(echec);
    }
  }

  function tete(titre, texte, boutonsHtml) {
    return '<div class="panneau-tete"><div><h2 class="org">' + titre + "</h2><p>" + texte + "</p></div>" + (boutonsHtml || "") + "</div>";
  }

  // =============== ACCUEIL ===============
  function vueAccueil(p) {
    lireTable("slides").then(function (lignes) {
      p.innerHTML = tete("Accueil", "Les photos du diaporama, dans l'ordre d'affichage. Indiquez pour chacune le parcours qu'elle montre : son nom s'affiche sur la photo.",
        '<button type="button" class="btn plein" data-ajout>Ajouter des photos</button>') + '<div class="liste" data-liste></div>';
      $("[data-ajout]", p).addEventListener("click", function () {
        choisirFichiers("image/*", true).then(function (fichiers) {
          if (!fichiers.length) return;
          toast("Envoi de " + fichiers.length + " photo(s)…");
          var ordre = lignes.length;
          fichiers.reduce(function (chaine, f) {
            return chaine.then(function () {
              return envoyerImage(f, "accueil", 2400).then(function (url) {
                ordre++;
                return sb.from("slides").insert({ image: url, parcours: "Les Aisses", ordre: ordre }).then(function (r) { if (r.error) throw r.error; });
              });
            });
          }, Promise.resolve()).then(function () { toast("Photos ajoutées. Pensez à choisir leur parcours."); vueAccueil(p); }).catch(echec);
        });
      });
      listeOrdonnable($("[data-liste]", p), "slides", lignes, function (l, i) {
        var el = document.createElement("div");
        el.innerHTML = '<span class="numero">' + (i + 1) + '</span><div class="vignette"><img src="' + esc(apercu(l.image)) + '" alt=""></div>' +
          '<div class="champs"><label>Parcours affiché sur la photo<select data-parcours><option>Les Aisses</option><option>La Canne</option></select></label></div><div class="actions"></div>';
        var sel = $("[data-parcours]", el);
        sel.value = l.parcours;
        sel.addEventListener("change", function () { maj("slides", l.id, { parcours: sel.value }).then(function () { toast("Parcours enregistré."); }).catch(echec); });
        $(".actions", el).appendChild(boutonSupprimer(function () {
          if (lignes.length <= 1) { toast("Gardez au moins une photo sur l'accueil.", true); vueAccueil(p); return; }
          sb.from("slides").delete().eq("id", l.id).then(function (r) {
            if (r.error) throw r.error;
            return supprimerFichier(l.image);
          }).then(function () { toast("Photo supprimée."); vueAccueil(p); }).catch(echec);
        }));
        return el;
      }, function () { vueAccueil(p); });
    }).catch(echec);
  }

  // =============== RESTAURANT (PDF) ===============
  function lireReglage(cle) {
    return sb.from("reglages").select("valeur").eq("cle", cle).maybeSingle().then(function (r) { if (r.error) throw r.error; return r.data ? r.data.valeur : {}; });
  }
  function ecrireReglage(cle, valeur) {
    return sb.from("reglages").upsert({ cle: cle, valeur: valeur, maj_le: new Date().toISOString() }).then(function (r) { if (r.error) throw r.error; });
  }
  function vueRestaurant(p) {
    lireReglage("pdf").then(function (pdf) {
      var blocs = [["menu_du_jour", "Menu du jour"], ["carte", "La carte du restaurant"]];
      p.innerHTML = tete("Restaurant", "Les documents PDF ouverts par les boutons « Plat du jour » et « La carte » du site.") +
        '<div class="tarifs-grille">' + blocs.map(function (b) {
          var actuel = pdf[b[0]];
          return '<div class="bloc"><h3>' + b[1] + '</h3><div class="pdf-actuel">' +
            (actuel ? 'Document en ligne : <a href="' + esc(actuel) + '" target="_blank" rel="noopener">ouvrir le PDF</a>' : "Aucun document pour l'instant.") +
            '</div><button type="button" class="btn plein" data-pdf="' + b[0] + '">Remplacer par un nouveau PDF</button></div>';
        }).join("") + "</div>";
      Array.prototype.forEach.call(p.querySelectorAll("[data-pdf]"), function (bouton) {
        bouton.addEventListener("click", function () {
          choisirFichiers("application/pdf", false).then(function (f) {
            if (!f.length) return;
            if (f[0].type !== "application/pdf") { toast("Choisissez un fichier PDF.", true); return; }
            if (f[0].size > 15 * 1024 * 1024) { toast("Ce PDF dépasse 15 Mo : réduisez-le avant de l'envoyer.", true); return; }
            var cle = bouton.getAttribute("data-pdf"), ancien = pdf[cle];
            toast("Envoi du PDF…");
            envoyer(nomFichier("pdf", "pdf"), f[0], "application/pdf").then(function (url) {
              pdf[cle] = url;
              return ecrireReglage("pdf", pdf).then(function () { return supprimerFichier(ancien); });
            }).then(function () { toast("PDF mis en ligne."); vueRestaurant(p); }).catch(echec);
          });
        });
      });
    }).catch(echec);
  }

  // =============== TARIFS ===============
  function vueTarifs(p) {
    lireReglage("tarifs").then(function (t) {
      var parcours = [["aisses", "Les Aisses"], ["canne", "La Canne"]];
      p.innerHTML = tete("Tarifs", "Green-fees affichés sur le site, en euros. La saison en cours est mise en avant automatiquement.") +
        '<form data-form-tarifs><div class="tarifs-grille">' + parcours.map(function (pc) {
          var v = t[pc[0]] || {};
          var champ = function (f, s) {
            var val = v[f] && v[f][s] !== undefined ? v[f][s] : "";
            return '<td><span class="euro"><input type="number" min="0" step="1" required name="' + pc[0] + "-" + f + "-" + s + '" value="' + esc(val) + '" aria-label="' + pc[1] + " " + f + " trous " + s + ' saison"> €</span></td>';
          };
          return '<div class="bloc"><h3>' + pc[1] + '</h3><table class="prix-table"><thead><tr><th></th><th>HAUTE SAISON</th><th>BASSE SAISON</th></tr></thead><tbody>' +
            '<tr><th scope="row">18 trous</th>' + champ("18", "haute") + champ("18", "basse") + "</tr>" +
            '<tr><th scope="row">9 trous</th>' + champ("9", "haute") + champ("9", "basse") + "</tr></tbody></table></div>";
        }).join("") + '</div><p style="margin-top:20px"><button class="btn plein" type="submit">Enregistrer les tarifs</button></p></form>';
      $("[data-form-tarifs]", p).addEventListener("submit", function (e) {
        e.preventDefault();
        var nouveau = {};
        Array.prototype.forEach.call(e.target.querySelectorAll("input"), function (i) {
          var k = i.name.split("-");
          nouveau[k[0]] = nouveau[k[0]] || {};
          nouveau[k[0]][k[1]] = nouveau[k[0]][k[1]] || {};
          nouveau[k[0]][k[1]][k[2]] = Number(i.value);
        });
        ecrireReglage("tarifs", nouveau).then(function () { toast("Tarifs enregistrés et en ligne."); }).catch(echec);
      });
    }).catch(echec);
  }

  // =============== PARCOURS (carte de score) ===============
  var DEPARTS = [["Noir", "#161616"], ["Blanc", "#F4F4F2"], ["Jaune", "#E9C22E"], ["Bleu", "#2F6FD0"], ["Rouge", "#D2363A"]];
  var NOMS_PARCOURS = { aisses: "Les Aisses", canne: "La Canne" };
  var parcoursCourant = "aisses";
  function vueParcours(p) {
    lireReglage("parcours").then(function (donnees) {
      if (!donnees || !donnees.aisses || !donnees.canne) { p.innerHTML = '<p class="chargement">Données des parcours introuvables.</p>'; return; }
      var modifie = false;
      var P = donnees[parcoursCourant], n = P.par.length;
      var somme = function (t, d, f) { var x = 0; for (var i = d; i < f; i++) x += Number(t[i]) || 0; return x; };
      var milliers = function (v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
      var blocs = n === 18 ? [["Aller", 0, 9], ["Retour", 9, 18]] : [["9 trous", 0, 9]];

      var ligne = function (cle, k, libelle, min, max, avecTotal) {
        return function (d, f) {
          var cells = "";
          for (var i = d; i < f; i++) {
            var v = cle === "dist" ? P.dist[k][i] : P[cle][i];
            cells += '<td><input type="number" inputmode="numeric" min="' + min + '" max="' + max + '" step="1" required value="' + esc(v) +
              '" data-cle="' + cle + '" data-k="' + k + '" data-i="' + i + '" aria-label="' + esc(libelle) + ", trou " + (i + 1) + '"></td>';
          }
          return "<tr><th scope=\"row\">" + (cle === "dist" ? '<span class="boule-admin" style="--c:' + DEPARTS[k][1] + '"></span>' : "") + esc(libelle) + "</th>" + cells +
            '<td class="tot" data-tot="' + cle + "-" + k + "-" + d + "-" + f + '">' + (avecTotal ? "" : "") + "</td></tr>";
        };
      };
      var lignes = [ligne("par", 0, "Par", 3, 6, true), ligne("hcp", 0, "Handicap", 1, 18, false)]
        .concat(DEPARTS.map(function (dep, k) { return ligne("dist", k, dep[0], 1, 800, true); }));

      p.innerHTML = tete("Parcours", "Longueurs des trous en mètres pour chaque départ, par et handicap. Les totaux se calculent automatiquement ; cliquez sur Enregistrer pour mettre en ligne.") +
        '<div class="onglets-parcours" role="tablist">' + Object.keys(NOMS_PARCOURS).map(function (c) {
          return '<button type="button" role="tab" aria-selected="' + (c === parcoursCourant) + '" class="btn' + (c === parcoursCourant ? " plein" : "") + '" data-parcours="' + c + '">' + NOMS_PARCOURS[c] + "</button>";
        }).join("") + "</div>" +
        '<div class="totaux-departs" data-totaux></div>' +
        '<form data-form-parcours novalidate>' + blocs.map(function (b) {
          var tetes = ""; for (var i = b[1]; i < b[2]; i++) tetes += '<th scope="col">' + (i + 1) + "</th>";
          return '<div class="bloc carte-admin"><h3>' + NOMS_PARCOURS[parcoursCourant] + " · " + b[0] + '</h3><div class="defile"><table class="score-admin"><thead><tr><th scope="col">Trou</th>' + tetes +
            '<th scope="col" class="tot">' + (n === 18 ? b[0] : "Total") + "</th></tr></thead><tbody>" +
            lignes.map(function (l) { return l(b[1], b[2]); }).join("") + "</tbody></table></div></div>";
        }).join("") +
        '<div class="barre-enregistrer"><span class="etat" data-etat>Aucune modification.</span><button class="btn plein" type="submit">Enregistrer les longueurs</button></div></form>';

      var form = $("[data-form-parcours]", p);
      function recalculer() {
        Array.prototype.forEach.call(p.querySelectorAll("[data-tot]"), function (td) {
          var k = td.getAttribute("data-tot").split("-"), cle = k[0];
          if (cle === "hcp") { td.textContent = ""; return; }
          var t = cle === "dist" ? P.dist[k[1]] : P[cle];
          td.textContent = milliers(somme(t, Number(k[2]), Number(k[3])));
        });
        $("[data-totaux]", p).innerHTML = DEPARTS.map(function (dep, k) {
          return '<div><span class="boule-admin" style="--c:' + dep[1] + '"></span><span>' + dep[0] + '</span><b>' + milliers(somme(P.dist[k], 0, n)) + " m</b></div>";
        }).join("") + '<div><span>Par</span><b>' + somme(P.par, 0, n) + "</b></div>";
      }
      form.addEventListener("input", function (e) {
        var inp = e.target; if (!inp.matches("input[data-cle]")) return;
        var cle = inp.getAttribute("data-cle"), k = Number(inp.getAttribute("data-k")), i = Number(inp.getAttribute("data-i"));
        var v = inp.value === "" ? 0 : Math.round(Number(inp.value));
        if (cle === "dist") P.dist[k][i] = v; else P[cle][i] = v;
        inp.classList.toggle("invalide", !inp.checkValidity());
        modifie = true;
        $("[data-etat]", p).textContent = "Modifications non enregistrées.";
        $("[data-etat]", p).classList.add("attention");
        recalculer();
      });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var invalides = Array.prototype.filter.call(form.querySelectorAll("input[data-cle]"), function (i) { return !i.checkValidity(); });
        if (invalides.length) {
          invalides.forEach(function (i) { i.classList.add("invalide"); });
          invalides[0].focus();
          toast("Vérifiez les cases en rouge (longueur 1 à 800 m, par 3 à 6, handicap 1 à 18).", true);
          return;
        }
        ecrireReglage("parcours", donnees).then(function () {
          modifie = false;
          $("[data-etat]", p).textContent = "Enregistré et en ligne.";
          $("[data-etat]", p).classList.remove("attention");
          toast("Longueurs enregistrées et en ligne.");
        }).catch(echec);
      });
      Array.prototype.forEach.call(p.querySelectorAll("[data-parcours]"), function (b) {
        b.addEventListener("click", function () {
          if (b.getAttribute("data-parcours") === parcoursCourant) return;
          if (modifie) { toast("Enregistrez d'abord les modifications de " + NOMS_PARCOURS[parcoursCourant] + ".", true); return; }
          parcoursCourant = b.getAttribute("data-parcours");
          vueParcours(p);
        });
      });
      recalculer();
    }).catch(echec);
  }

  // =============== SÉJOURNER ===============
  function vueSejour(p) {
    lireTable("hebergements").then(function (lignes) {
      p.innerHTML = tete("Séjourner", "Les hébergements proposés. L'étiquette s'affiche au-dessus du nom (ex. « Hôtel ★★★★ »).",
        '<button type="button" class="btn plein" data-ajout>Ajouter un hébergement</button>') + '<div class="liste" data-liste></div>';
      $("[data-ajout]", p).addEventListener("click", function () {
        sb.from("hebergements").insert({ nom: "Nouvel hébergement", etiquette_fr: "Hôtel", etiquette_en: "Hotel", ordre: lignes.length + 1 })
          .then(function (r) { if (r.error) throw r.error; toast("Hébergement ajouté : complétez sa fiche."); vueSejour(p); }).catch(echec);
      });
      listeOrdonnable($("[data-liste]", p), "hebergements", lignes, function (l) {
        var el = document.createElement("form");
        el.innerHTML = '<div class="vignette">' + (l.image ? '<img src="' + esc(apercu(l.image)) + '" alt="">' : "") + "</div>" +
          '<div class="champs">' +
          '<label>Nom<input type="text" name="nom" required value="' + esc(l.nom) + '"></label>' +
          '<label>Étiquette (français)<input type="text" name="etiquette_fr" value="' + esc(l.etiquette_fr) + '"></label>' +
          '<label>Étiquette (anglais)<input type="text" name="etiquette_en" value="' + esc(l.etiquette_en) + '"></label>' +
          '<label>Lien du site<input type="url" name="lien" placeholder="https://" value="' + esc(l.lien) + '"></label>' +
          '</div><div class="actions"><button type="button" class="btn" data-photo>Changer la photo</button><button type="submit" class="btn plein">Enregistrer</button></div>';
        el.addEventListener("submit", function (e) {
          e.preventDefault();
          maj("hebergements", l.id, { nom: el.nom.value.trim(), etiquette_fr: el.etiquette_fr.value.trim(), etiquette_en: el.etiquette_en.value.trim(), lien: el.lien.value.trim() })
            .then(function () { toast("« " + el.nom.value.trim() + " » enregistré."); }).catch(echec);
        });
        $("[data-photo]", el).addEventListener("click", function () {
          choisirFichiers("image/*", false).then(function (f) {
            if (!f.length) return;
            toast("Envoi de la photo…");
            envoyerImage(f[0], "hebergements", 1200).then(function (url) {
              return maj("hebergements", l.id, { image: url }).then(function () { return supprimerFichier(l.image); });
            }).then(function () { toast("Photo remplacée."); vueSejour(p); }).catch(echec);
          });
        });
        $(".actions", el).appendChild(boutonSupprimer(function () {
          sb.from("hebergements").delete().eq("id", l.id).then(function (r) {
            if (r.error) throw r.error; return supprimerFichier(l.image);
          }).then(function () { toast("Hébergement supprimé."); vueSejour(p); }).catch(echec);
        }));
        return el;
      }, function () { vueSejour(p); });
    }).catch(echec);
  }

  // =============== MÉDIAS ===============
  function vueMedias(p) {
    lireTable("medias").then(function (lignes) {
      p.innerHTML = tete("Médias", "Les images de la galerie, dans l'ordre d'affichage. Les légendes apparaissent dans la visionneuse. Faites glisser une image ou utilisez les flèches pour la déplacer.",
        '<button type="button" class="btn plein" data-ajout>Ajouter des photos</button>') + '<div class="grille" data-liste></div>';
      $("[data-ajout]", p).addEventListener("click", function () {
        choisirFichiers("image/*", true).then(function (fichiers) {
          if (!fichiers.length) return;
          toast("Envoi de " + fichiers.length + " photo(s)…");
          var ordre = lignes.length;
          fichiers.reduce(function (chaine, f) {
            return chaine.then(function () {
              return envoyerImage(f, "medias", 2400).then(function (url) {
                ordre++;
                return sb.from("medias").insert({ image: url, ordre: ordre, legende_fr: "", legende_en: "" }).then(function (r) { if (r.error) throw r.error; });
              });
            });
          }, Promise.resolve()).then(function () { toast("Photos ajoutées en fin de galerie."); vueMedias(p); }).catch(echec);
        });
      });
      listeOrdonnable($("[data-liste]", p), "medias", lignes, function (l, i) {
        var el = document.createElement("div");
        el.innerHTML = '<div class="vignette"><img src="' + esc(apercu(l.image)) + '" alt=""></div>' +
          (l.video ? '<span class="badge">Film · ouvre la vidéo</span>' : "") +
          '<label>Légende (français)<input type="text" data-champ="legende_fr" value="' + esc(l.legende_fr) + '"></label>' +
          '<label>Légende (anglais)<input type="text" data-champ="legende_en" value="' + esc(l.legende_en) + '"></label>' +
          '<div class="actions"><span class="numero">' + (i + 1) + "</span></div>";
        Array.prototype.forEach.call(el.querySelectorAll("[data-champ]"), function (input) {
          var initial = input.value;
          input.addEventListener("change", function () {
            var champs = {}; champs[input.getAttribute("data-champ")] = input.value.trim();
            maj("medias", l.id, champs).then(function () { initial = input.value; toast("Légende enregistrée."); }).catch(function (e) { input.value = initial; echec(e); });
          });
        });
        $(".actions", el).appendChild(boutonSupprimer(function () {
          sb.from("medias").delete().eq("id", l.id).then(function (r) {
            if (r.error) throw r.error; return supprimerFichier(l.image);
          }).then(function () { toast("Image supprimée."); vueMedias(p); }).catch(echec);
        }));
        return el;
      }, function () { vueMedias(p); });
    }).catch(echec);
  }
})();
