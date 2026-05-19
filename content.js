// =============================================================
// ✨ CONTENU ÉDITABLE — Personnalise tout ici, sans toucher au reste
// =============================================================
//
// 1) capsules         : 1 message déverrouillé par jour (dans l'ordre)
// 2) milestones       : messages spéciaux qui s'ouvrent à J-30, J-20, J-10, J-7, J-3, J-1, J-0
// 3) memoryPairs      : 8 symboles (emoji ou image) pour le jeu de mémoire
// 4) memoryWinMessage : ce qui s'affiche quand elle gagne le jeu
//
// Astuce : pour des photos dans le jeu mémoire, remplace un emoji par :
//   { img: "https://exemple.com/photo.jpg" }
// =============================================================

window.APP_CONTENT = {

  // ---------- 1) Capsules quotidiennes ----------
  // L'ordre = ordre de déverrouillage. Mets au moins 60 messages (49 jours + marge).
  capsules: [
    "Bienvenue dans ton petit jardin secret. Chaque jour, une capsule t'attend ici. Je pense à toi. 🤍",
    "Si je pouvais raccourcir le temps, je l'aurais déjà fait. En attendant, je compte avec toi.",
    "Aujourd'hui je t'imagine en train de marcher dans Berlin, et ça me fait sourire.",
    "Tu es la plus belle pensée de mes journées.",
    "Tu sais ce que j'aime chez toi ? Tout. Vraiment, tout.",
    "Le canapé est trop grand quand tu n'es pas là.",
    "Je suis fier·e de ce que tu accomplis, même quand c'est dur.",
    "Une semaine de plus, c'est une semaine de plus à t'aimer.",
    "Mon café du matin a un goût bizarre quand je le bois seul·e.",
    "Je viens de penser à ce rire que tu as quand tu es vraiment fatiguée. Il me manque.",
    "Tu es ma personne. Toujours.",
    "Si Strasbourg pouvait te ramener plus vite, je lui demanderais.",
    "J'ai gardé une chanson pour toi. Je te la fais écouter quand tu rentres.",
    "Tu m'as déjà rendu·e meilleur·e, et tu ne le sais peut-être même pas.",
    "On va faire des trucs nuls et géniaux ensemble dès que tu reviens. Promis.",
    "Tiens bon. Vraiment. Je suis là, à l'autre bout du fil.",
    "Le compte à rebours est aussi un compte vers nous.",
    "Tu mérites des câlins de 12 heures. Je prépare le stock.",
    "Je t'aime même quand tu es loin. Surtout quand tu es loin.",
    "Aujourd'hui, ferme les yeux et imagine la gare de Strasbourg. J'y serai.",
    "Pense à un endroit où on a ri très fort. Je le revois aussi.",
    "Tu es plus forte que ce voyage. Et bientôt tu seras à la maison.",
    "Je t'imagine en train de lire ça avec ta tête du matin. Elle me manque.",
    "Petit rappel : tu es exceptionnelle.",
    "Encore quelques pages de ce chapitre, et on commence le prochain ensemble.",
    "Je note toutes les choses qu'on fera quand tu rentres. La liste est longue.",
    "Tu es ma maison.",
    "Aujourd'hui je t'envoie tout mon courage par la pensée. Prends-en plein.",
    "Le ciel est joli ce soir. J'aurais aimé te le montrer.",
    "Tu me manques d'une façon qui ne se dit pas avec des mots normaux.",
    "Plus que 30 jours. On y est presque, vraiment.",
    "Je te promets un dîner improbable le soir de ton retour.",
    "Tu as le droit d'être fatiguée. Tu as fait tellement de choses.",
    "Une pensée pour toi, comme un baiser dans le vent.",
    "Tu es le meilleur 'bonjour' et le meilleur 'bonne nuit'.",
    "Je sors la couette préférée du placard, elle t'attend.",
    "Ne lâche rien. Tu rentres bientôt.",
    "Je t'aime aujourd'hui plus qu'hier, et moins que demain.",
    "Tu sais que t'es géniale, hein ? Au cas où, je te le redis.",
    "On va se faire une journée pyjama de 24 heures dès que tu rentres.",
    "Ton odeur me manque. C'est bête à dire, mais voilà.",
    "Je crois que je deviens un peu trop nul·le en cuisine sans toi.",
    "Encore un peu de patience. Le retour vaudra chaque seconde.",
    "Tu vas voir, on va faire un truc improvisé et parfait à ton retour.",
    "Le plus dur est derrière toi. Vraiment.",
    "Plus que quelques jours. Je commence à les compter en heures.",
    "Tu es mon premier message du matin, mon dernier de la nuit.",
    "J'ai préparé une playlist pour le trajet retour. Surprise.",
    "Bientôt, Strasbourg, toi, moi, et tout le reste.",
    "Le train va arriver. Pour de vrai. Je serai là, sur le quai.",
    "Une semaine. Sept jours. Cent soixante-huit heures. On y arrive.",
    "Trois jours. Tu sens ? Ça approche.",
    "Demain demain demain. (Je peux pas faire plus court.)",
    "Aujourd'hui. C'est aujourd'hui. Je t'attends.",
    "💕",
    "Tu es là. Enfin. Je respire mieux.",
    "Bonus : merci d'avoir tenu. Tu es incroyable.",
    "Bonus : je suis tellement content·e que tu sois rentrée.",
    "Bonus : on est ensemble. C'est tout ce qui compte.",
    "Bonus : pour les jours où tu ouvres encore l'app, juste pour le plaisir. Je t'aime."
  ],

  // ---------- 2) Paliers (J-X) ----------
  // Clé = nombre de jours restants. Se déverrouille automatiquement à ce moment.
  milestones: {
    30: {
      title: "J-30",
      icon: "🌙",
      message: "Un mois pile. On a déjà fait la moitié du chemin sans s'en rendre compte. Tu es presque là."
    },
    20: {
      title: "J-20",
      icon: "✨",
      message: "Vingt jours. C'est court. C'est presque rien comparé à ce qu'on a déjà vécu."
    },
    10: {
      title: "J-10",
      icon: "🌸",
      message: "Dix jours seulement. On entre dans la dernière ligne droite. Tiens bon, je te tiens."
    },
    7: {
      title: "J-7",
      icon: "🎈",
      message: "Une semaine. Sept matins. Sept soirs. Et après, plus jamais de compte à rebours."
    },
    3: {
      title: "J-3",
      icon: "⭐",
      message: "Trois jours. Je commence à préparer le retour. Tout sera prêt pour toi."
    },
    1: {
      title: "J-1",
      icon: "💫",
      message: "Demain. DEMAIN. Tu rentres demain. Je n'arrive pas à y croire."
    },
    0: {
      title: "Jour J",
      icon: "💕",
      message: "Aujourd'hui. À 18 h 34. Sur le quai. Je t'attends. Reviens-moi."
    }
  },

  // ---------- 3) Jeu mémoire ----------
  // Pool de photos. À chaque nouvelle partie, 8 photos sont tirées au hasard.
  // Pour utiliser des emojis à la place, remplace par : memoryPairs: ["🌹", "🥐", ...]
  memoryPairs: [
    { img: "photos/web/IMG_0023.jpg" },
    { img: "photos/web/IMG_0037.jpg" },
    { img: "photos/web/IMG_0085.jpg" },
    { img: "photos/web/IMG_0341.jpg" },
    { img: "photos/web/IMG_0367.jpg" },
    { img: "photos/web/IMG_0434.jpg" },
    { img: "photos/web/IMG_0435.jpg" },
    { img: "photos/web/IMG_0530.jpg" },
    { img: "photos/web/IMG_0751.jpg" },
    { img: "photos/web/IMG_0829.jpg" },
    { img: "photos/web/IMG_0870.jpg" },
    { img: "photos/web/IMG_0889.jpg" },
    { img: "photos/web/IMG_0954.jpg" },
    { img: "photos/web/IMG_1121.jpg" },
    { img: "photos/web/IMG_1156.jpg" },
    { img: "photos/web/IMG_1174.jpg" },
    { img: "photos/web/IMG_1215.jpg" },
    { img: "photos/web/IMG_9876.jpg" },
    { img: "photos/web/IMG_1222.jpg" },
    { img: "photos/web/IMG_1245.jpg" },
    { img: "photos/web/IMG_1264.jpg" },
    { img: "photos/web/IMG_1300.jpg" },
    { img: "photos/web/IMG_1326.jpg" },
    { img: "photos/web/IMG_1444.jpg" },
    { img: "photos/web/IMG_1512.jpg" },
    { img: "photos/web/IMG_1527.jpg" },
    { img: "photos/web/IMG_1552.jpg" }, 
    { img: "photos/web/IMG_1561.jpg" }
  ],

  memoryWinMessage: "Bravo ma belle 💕 Encore un jour de gagné.",

  // ---------- Puzzle photo ----------
  puzzleWinMessage: "Puzzle reconstitué ! 🧩 Comme nous deux bientôt.",

  // ---------- Question du jour ----------
  // 1 question par jour, cyclique. Même question pour les deux partenaires le même jour.
  // Index = (jours écoulés depuis PROMPTS_START_DATE) % nb de questions.
  dailyQuestions: [
    "Quel est ton meilleur souvenir avec moi ?",
    "Si on partait en week-end demain, où on irait ?",
    "Quelle chanson te fait penser à nous ?",
    "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
    "Quel petit défaut de l'autre tu aimes secrètement ?",
    "Si tu pouvais revivre une journée avec moi, laquelle ?",
    "Ton plat préféré qu'on cuisine ensemble ?",
    "Une chose que tu veux qu'on apprenne ensemble ?",
    "Le moment où tu as su que tu m'aimais ?",
    "Quel surnom tu adores qu'on te donne ?",
    "Si on adoptait un animal, ce serait quoi ?",
    "Une destination de rêve à partager ?",
    "Ton premier souvenir de moi ?",
    "Qu'est-ce qui te manque le plus en ce moment ?",
    "Une habitude de moi qui te fait fondre ?",
    "Le film qu'on doit absolument revoir ensemble ?",
    "Si on avait une maison de rêve, elle aurait quoi ?",
    "Ton souvenir de fou-rire avec moi ?",
    "Une promesse qu'on s'est faite et qu'on a tenue ?",
    "Quelle saison te rappelle nous ?",
    "Ce que tu cuisinerais pour notre anniversaire ?",
    "Une chose qu'on n'a jamais faite et qu'on devrait faire ?",
    "Quel parfum, quelle odeur me représente pour toi ?",
    "Si on écrivait un livre ensemble, ce serait sur quoi ?",
    "Ton instant câlin idéal ?",
    "Une scène de film qui nous ressemble ?",
    "Ce qui te fait le plus rire chez moi ?",
    "Une qualité de moi que tu admires ?",
    "Ton matin parfait avec moi ?",
    "Si je devais t'offrir un cadeau impossible, ce serait quoi ?",
    "Une mini-aventure à improviser à ton retour ?",
    "Un endroit à Strasbourg que tu veux me montrer ?",
    "Un endroit à Berlin dont tu veux que je me souvienne avec toi ?",
    "Trois mots pour décrire notre couple ?",
    "Ton souvenir de fou-rire incontrôlable ?",
    "Une recette qu'on doit absolument tester ?",
    "Si on faisait une playlist 'retour', quelle chanson en premier ?",
    "Une habitude à inventer ensemble dès ton retour ?",
    "Ce que je te dis qui te fait toujours sourire ?",
    "Un rituel du dimanche qu'on devrait instaurer ?",
    "Une chose que tu veux qu'on apprenne par cœur ?",
    "Ton soir de semaine idéal avec moi ?",
    "Une mini-tradition de couple à créer ?",
    "Si on partait en road-trip, on emmène quoi ?",
    "Une chose pour laquelle je peux toujours compter sur toi ?",
    "Ton mot d'amour préféré dans une langue étrangère ?",
    "Si on avait un jardin, on planterait quoi ?",
    "Ce qui te rassure le plus quand t'es loin ?",
    "Un objet à toi qui me ferait penser à toi ?",
    "Le plus beau message que je t'ai envoyé ?",
    "Une question que tu m'as toujours voulu poser ?",
    "Une chose dont tu es fière en ce moment ?",
    "Quelque chose que tu apprécies de cette distance, même si c'est dur ?",
    "Si on était deux personnages de fiction, lesquels ?",
    "Une chose que tu fais juste pour moi sans le dire ?",
    "Notre pire fou-rire ?",
    "Notre plus beau silence ?",
    "Si on devait écrire notre histoire en un titre, ce serait quoi ?",
    "Le truc le plus bête qu'on s'est dit et qu'on garde en private joke ?",
    "Une promesse à se faire pour les prochaines années ?"
  ],

  // ---------- 4) Sujets de dessin quotidien ----------
  // 1 sujet par jour, cyclique. Index = (jours écoulés depuis PROMPTS_START_DATE) % nb sujets.
  // Le même sujet est servi aux deux partenaires le même jour.
  dailyPrompts: [
    "Ta tasse préférée",
    "Un souvenir d'enfance",
    "Un fruit qui n'existe pas",
    "La mer un soir d'orage",
    "Ton coin secret",
    "Une plante imaginaire",
    "Le visage de la joie",
    "Un monstre gentil",
    "La fenêtre d'un train",
    "Un plat qui te ramène en arrière",
    "Une chambre rêvée",
    "Ton animal-totem",
    "Le matin parfait",
    "Une ville sous la pluie",
    "Un objet que tu chéris",
    "Le bruit du silence",
    "Une étoile filante",
    "Un café au comptoir",
    "Une porte qui ne s'ouvre jamais",
    "Un visage flou de mémoire",
    "Le ciel à 18 h 34",
    "Un trésor dans un tiroir",
    "Une rose qui parle",
    "Un instrument de musique imaginaire",
    "Un déguisement absurde",
    "Le jardin que tu rêves",
    "Une recette en image",
    "Une carte du monde inventée",
    "Un timbre-poste pour votre couple",
    "Le doudou de tes 8 ans",
    "Un dragon timide",
    "Un nuage en forme de quelque chose",
    "Une fenêtre vue de l'intérieur",
    "Une fenêtre vue de l'extérieur",
    "Un message en bouteille",
    "Le portrait de ton humeur du jour",
    "Une boussole vers l'autre",
    "Une maison sur l'eau",
    "Une bibliothèque de souvenirs",
    "Un costume pour aller danser",
    "La pluie sur une fleur",
    "Un escalier qui ne mène nulle part",
    "Un train pour Strasbourg",
    "Une lettre jamais envoyée",
    "Le portrait d'un café",
    "Une lampe qui éclaire un secret",
    "Une montagne intérieure",
    "Un poisson qui n'a pas peur",
    "Le contenu de tes poches",
    "Une étreinte vue d'en haut",
    "Un parapluie pour deux",
    "Une saison à inventer",
    "Un fauteuil pour rêver",
    "Une planète que toi seule habites",
    "Le pays imaginaire de tes 8 ans",
    "Une vague qui ramène quelqu'un",
    "Un nuage de mots doux",
    "Un téléphone qui sonne dans le vide",
    "Une chanson en dessin",
    "Une carte postale de Berlin",
    "Une carte postale de Strasbourg",
    "Le coucher de soleil d'hier",
    "Une étreinte entre deux silhouettes",
    "Un oiseau qui rentre à la maison",
    "Le portrait de ce moment précis"
  ]
};
