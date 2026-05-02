import type { Game } from "./types";

export const POOL: Game[] = [
 // BATTLE ROYALE
 { id: 1, name: "Fortnite", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Victory Royale (Top 1) en trio", cover: "/covers/fortnite.jpg" },
 { id: 2, name: "Apex Legends", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Champion (Top 1) en trio", appid: 1172470 },
 { id: 3, name: "PUBG: Battlegrounds", cat: "Battle Royale", mode: "team", normal: "Top 10 en duo", hardcore: "Chicken Dinner (Top 1)", appid: 578080 },
 { id: 4, name: "The Finals", cat: "Battle Royale", mode: "team", normal: "Win en Quick Cash trio", hardcore: "Win en Normal", appid: 2073850 },
 { id: 5, name: "Naraka: Bladepoint", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio", appid: 1203220 },
 { id: 6, name: "Super Animal Royale", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio", appid: 843380 },
 { id: 7, name: "Fall Guys", cat: "Party", mode: "team", normal: "Atteindre la finale en escouade", hardcore: "Décrocher une COURONNE en escouade", appid: 1097150 },
 { id: 8, name: "Stumble Guys", cat: "Party", mode: "team", soloHardcore: true, normal: "Au moins 1 joueur dans le Top 5", hardcore: "Joueur tiré au sort GAGNE la partie", appid: 1677740 },
 { id: 9, name: "Crab Game", cat: "Party", mode: "team", soloHardcore: true, normal: "Au moins 1 joueur survit à la saison", hardcore: "Joueur tiré au sort GAGNE la saison", appid: 1782210 },
 { id: 10, name: "Geoguessr Battle Royale", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré au sort gagne 1 partie", hardcore: "Joueur tiré au sort gagne 3 parties d'affilée", cover: "/covers/geoguessr-battle-royale.jpg" },
 { id: 11, name: "MiniRoyale", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio", appid: 1657090 },
 { id: 12, name: "SUPERVIVE", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio", appid: 1283700 },

 // FPS
 { id: 13, name: "Counter-Strike 2", cat: "FPS Compétitif", mode: "duo", normal: "2 joueurs tirés gagnent un match Wingman", hardcore: "2 joueurs tirés gagnent 2 Wingman d'affilée", appid: 730 },
 { id: 14, name: "Rainbow Six Siege", cat: "FPS Compétitif", mode: "team", normal: "Win une partie Quick Match", hardcore: "Win une partie Normal", appid: 359550 },
 { id: 15, name: "Ready or Not", cat: "FPS Coop", mode: "team", normal: "Finir une mission en coop", hardcore: "Mission avec 0 morts civils", appid: 1144200 },
 { id: 16, name: "Team Fortress 2", cat: "FPS Compétitif", mode: "team", normal: "Win une partie de Payload", hardcore: "Win une partie de Payload", appid: 440 },
 { id: 17, name: "DOOM", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survie 20 minutes", hardcore: "Joueur tiré survie 30 minutes", appid: 379720 },
 { id: 18, name: "Payday 2", cat: "FPS Coop", mode: "team", normal: "Réussir une mission", hardcore: "Réussir un mission en Death Sentence", appid: 218620 },
 { id: 19, name: "Left 4 Dead 2", cat: "FPS Coop", mode: "team", normal: "Finir une zone", hardcore: "Finir 3 zone", appid: 550 },
 { id: 20, name: "Back 4 Blood", cat: "FPS Coop", mode: "team", normal: "Finir un zone", hardcore: "Finir 2 zone", appid: 924970 },
 { id: 21, name: "Deep Rock Galactic", cat: "FPS Coop", mode: "team", normal: "Finir une mission Hazard 4", hardcore: "Finir une mission Hazard 5", appid: 548430 },
 { id: 22, name: "Risk of Rain 2", cat: "FPS Coop", mode: "team", normal: "Faire 2 etages", hardcore: "Faire 4 etages", appid: 632360 },

 // PARTY / COOP FUN
 { id: 23, name: "Rocket League", cat: "Sport", mode: "team", normal: "Win 2 matchs ranked", hardcore: "Win 5 match ranked", appid: 252950 },
 { id: 24, name: "Overcooked! 2", cat: "Coop", mode: "team", normal: "3 étoiles sur un niveau Monde 5+", hardcore: "4 étoiles sur un niveau Monde 5+", appid: 728880 },
 { id: 25, name: "Moving Out 2", cat: "Coop", mode: "team", normal: "Finir un niveau", hardcore: "All medals sur un niveau", appid: 2179040 },
 { id: 26, name: "Gang Beasts", cat: "Party", mode: "solo", normal: "un joueur tiré gagne la vague 2", hardcore: "Joueur tiré gagne les vague", appid: 285900 },
 { id: 27, name: "Human Fall Flat", cat: "Coop", mode: "team", normal: "Finir un niveau coop", hardcore: "Speedrun un niveau (record team)", appid: 477160 },
 { id: 28, name: "Move or Die", cat: "Party", mode: "team", soloHardcore: true, normal: "Win une partie", hardcore: "Joueur tiré gagne 5 rounds d'affilée", appid: 323850 },
 { id: 29, name: "Ultimate Chicken Horse", cat: "Party", mode: "team", normal: "Atteindre 5 points", hardcore: "Atteindre 10 points", appid: 386940 },
 { id: 30, name: "Golf With Your Friends", cat: "Party", mode: "team", soloHardcore: true, normal: "Win un parcours 18 trous", hardcore: "Joueur tiré au sort termine sous le par", appid: 431240 },
 { id: 31, name: "Stick Fight: The Game", cat: "Party", mode: "solo", normal: "Joueur tiré gagne 1 round", hardcore: "Joueur tiré gagne 5 rounds d'affilée", appid: 674940 },
 { id: 32, name: "SpeedRunners", cat: "Party", mode: "solo", normal: "Joueur tiré gagne une race", hardcore: "Joueur tiré gagne 3 races d'affilée", appid: 207140 },
 { id: 33, name: "Tricky Towers", cat: "Party", mode: "solo", normal: "Joueur tiré gagne un match", hardcore: "Joueur tiré gagne 3 matchs d'affilée", appid: 437920 },
 { id: 34, name: "PICO PARK", cat: "Coop", mode: "team", normal: "Finir un niveau", hardcore: "Finir un Final Stage", appid: 1509960 },
 { id: 35, name: "Boomerang Fu", cat: "Party", mode: "team", normal: "Win un match", hardcore: "Win 3 matchs d'affilée", appid: 965680 },
 { id: 36, name: "Super Battle Golf", cat: "Party", mode: "team", normal: "Win un parcours", hardcore: "Win 3 parcours d'affilée", cover: "/covers/super-battle-golf.jpg" },
 { id: 37, name: "Golf It", cat: "Party", mode: "solo", normal: "Win un parcours 18 trous", hardcore: "Joueur tiré au sort termine sous le par", appid: 571740 },
 { id: 38, name: "Cuphead", cat: "Coop", mode: "team", normal: "Battre un boss en coop", hardcore: "Battre un boss en Expert en coop", appid: 268910 },

 // HORROR / DEDUCTION / COOP
 { id: 39, name: "Phasmophobia", cat: "Horror Coop", mode: "team", normal: "Identifier le ghost", hardcore: "Identifier le ghost en Nightmare", appid: 739630 },
 { id: 40, name: "Lethal Company", cat: "Horror Coop", mode: "team", normal: "Acheter la premiére lune", hardcore: "Atteindre quota 3000+", appid: 1966720 },
 { id: 41, name: "R.E.P.O.", cat: "Horror Coop", mode: "team", normal: "Finir les 3 premiére room", hardcore: "Atteindre quota légendaire (lvl 10+)", appid: 3241660 },
 { id: 42, name: "Content Warning", cat: "Horror Coop", mode: "team", normal: "Obtenir 100k+ vues sur une vidéo", hardcore: "Atteindre le Star (3 jours all-time)", appid: 2881650 },
 { id: 43, name: "Buckshot Roulette", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré gagne une partie Multiplayer", hardcore: "Joueur tiré gagne en Double or Nothing", appid: 2835570 },

 // SURVIVAL / SANDBOX
 { id: 44, name: "Minecraft", cat: "Sandbox", mode: "team", normal: "Battre l'Ender Dragon en coop", hardcore: "Battre Wither + Ender Dragon", cover: "/covers/minecraft.jpg" },
 { id: 45, name: "Raft", cat: "Survie", mode: "team", normal: "Survivre 20 minutes sans mourir", hardcore: "Survivre 30 minutes sans mourir", appid: 648800 },
 { id: 46, name: "Peak", cat: "Survie", mode: "team", normal: "Faire le premier biome", hardcore: "Atteindre le 3 eme biome", appid: 3527290, cover: "/covers/peak.jpg" },
 { id: 47, name: "Half Dead 2", cat: "Survie", mode: "team", normal: "S'échapper en coop", hardcore: "S'échapper en mode Hard", appid: 914260 },

 // PUZZLE / NARRATIF
 { id: 48, name: "Portal 2", cat: "Puzzle", mode: "duo", normal: "2 joueurs tirés finissent une chambre coop avec un temps impatie", hardcore: "Finir un chapitre sans mourir", appid: 620 },
 { id: 49, name: "Escape Simulator", cat: "Puzzle", mode: "team", normal: "Finir une room en coop", hardcore: "Finir une room avant le temps de fin", appid: 1435790 },
 { id: 50, name: "Carry The Glass", cat: "Coop", mode: "duo", normal: "2 joueurs tirés finissent les 5 premier checkpoints avec 3 chances", hardcore: "2 joueurs tirés finissent les 5 premier Checkpoints sans casser le verre", appid: 3263320 },
 { id: 51, name: "Chained Together", cat: "Coop", mode: "team", normal: "Atteindre 500m avec 3 chances", hardcore: "Atteindre 1000m minimum", appid: 2567870 },

 // FIGHTING
 { id: 52, name: "Tekken 8", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un match Ranked", hardcore: "Joueur tiré gagne un match Ranked", appid: 1778820 },
 { id: 53, name: "Tekken 7", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un match Ranked", hardcore: "Joueur tiré gagne une Ranked", appid: 389730 },
 { id: 54, name: "Mortal Kombat 1", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne une Ranked", appid: 1971870 },
 { id: 55, name: "Mortal Kombat 11", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne une Ranked", appid: 976310 },
 { id: 56, name: "Street Fighter V", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne une Ranked", appid: 310950 },
 { id: 57, name: "MultiVersus", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un 1v1 Ranked", hardcore: "Joueur tiré gagne 2 games un Ranked", appid: 1818750 },
 { id: 58, name: "Brawlhalla", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un 1v1 Ranked", hardcore: "Joueur tiré gagne un 1v1 Ranked", appid: 291550 },
 { id: 59, name: "Injustice 2", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne 3 games d'affilée", appid: 627270 },
 { id: 60, name: "Furi", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré bat un boss", hardcore: "Joueur tiré bat un boss en Furier", appid: 423230 },

 // RACING / SPORT
 { id: 61, name: "Trackmania", cat: "Racing", mode: "duo", normal: "2 joueurs tirés gagnent un match Ranked", hardcore: "2 joueurs tirés gagnent 2 Ranked d'affilée", appid: 2225070 },
 { id: 62, name: "Wreckfest", cat: "Racing", mode: "team", soloHardcore: true, normal: "top 5 sur une course", hardcore: "Joueur tiré finit P1 sur une course", appid: 228380 },
 { id: 63, name: "Riders Republic", cat: "Racing", mode: "team", normal: "Top 20 sur une mass race", hardcore: "Top 10 sur une mass race", appid: 2290180 },
 { id: 64, name: "Lonely Mountains: Downhill", cat: "Solo Champion", mode: "solo", normal: "Médaille OR sur une piste bleu", hardcore: "finir une piste noir en OR sur une piste", appid: 711540 },
 { id: 65, name: "EA Sports FC 25", cat: "Sport", mode: "team", normal: "Win un match Pro Clubs", hardcore: "Win 2 Pro Clubs d'affilée", appid: 2669320 },
 { id: 66, name: "Rematch", cat: "Sport", mode: "team", normal: "Win un match", hardcore: "Win un match Ranked", appid: 2670630 },

 // RHYTHM / SOLO CHAMPION
 { id: 67, name: "Beat Saber", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré FC une map normal", hardcore: "Joueur tiré FC une map Expert+", appid: 620980 },
 { id: 68, name: "OSU!", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré pass une map 3★+", hardcore: "Joueur tiré FC une map 5★+", cover: "/covers/osu.png" },
 { id: 69, name: "A Dance of Fire and Ice", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré finit un niveau choisit", hardcore: "Joueur tiré finit un niveau personnalisé choisir", appid: 977950 },
 { id: 70, name: "Celeste", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré finit 2 niveau choisit", hardcore: "Joueur tiré finit un chapitre B-Side", appid: 504230 },

 // ROGUELITE / SOLO
 { id: 71, name: "Balatro", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré win une run avec une deck Aleatoire", hardcore: "Joueur tiré win en Stake Gold+ avec une deck Aleatoire", appid: 2379780 },
 { id: 72, name: "Megabonk", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survit 20 minutes", hardcore: "Joueur tiré win en mode hard", appid: 3405340 },
 { id: 73, name: "Brotato", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré franchit la vague 5", hardcore: "Joueur tiré franchit vague 10", appid: 1942280 },
 { id: 74, name: "Vampire Survivors", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survit 30 minutes", hardcore: "Joueur tiré survie 40 minutes", appid: 1794680 },
 { id: 75, name: "20 Minutes Till Dawn", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survit 20 minutes", hardcore: "Joueur tiré finit un boss en hard", appid: 1966900 },
 { id: 76, name: "Timberman", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré atteint score 100+", hardcore: "Joueur tiré atteint score 250+", appid: 398710 },

 // MOBA / TD
 { id: 77, name: "League of Legends", cat: "MOBA", mode: "team", normal: "Win une partie en Aram", hardcore: "Win une partie Ranked Flex", cover: "/covers/league-of-legends.jpg" },
 { id: 78, name: "Artisan TD", cat: "Coop", mode: "solo", normal: "Un joueur tiré Finir un niveau en mode Normal", hardcore: "Un joueur tiré Finir un niveau en mode Vétérant", appid: 2224640 },

 // QUIZ / DIVERS
 { id: 79, name: "Qui veut gagner des millions", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré atteint pallier 2", hardcore: "Joueur tiré gagne sans utiliser de joker", appid: 1356240 },
 { id: 80, name: "The Escapists", cat: "Coop", mode: "team", normal: "Réussir une évasion en coop", hardcore: "Évasion sans déclencher d'alarme", appid: 298630 },
 { id: 81, name: "Final Sentence", cat: "Battle Royale", mode: "solo", normal: "Joueur tiré au sort Top 10 en Classic BR", hardcore: "Joueur tiré GAGNE une Classic BR ou un Duel", appid: 2413950 },

  // === ADDITIONS FROM EXCEL ===
  { id: 82, name: "Kallax", cat: "Coop", mode: "team", normal: "Finir un niveau", hardcore: "Finir un niveau hard", appid: 1818280 },
  { id: 83, name: "Micro works", cat: "Coop", mode: "team", normal: "Finir un niveau coop", hardcore: "Finir un niveau hard", appid: 1233410 },

  // === BATCH ADDITIONS ===
  { id: 84, name: "Mimesis", cat: "Horror Coop", mode: "team", normal: "Survivre une partie en coop", hardcore: "Survivre sans qu'aucun coéquipier ne se fasse imiter", appid: 2827200 },
  { id: 85, name: "YapYap", cat: "Horror Coop", mode: "team", normal: "Atteindre l'objectif de vandalisme en coop", hardcore: "Atteindre l'objectif sans se faire repérer", appid: 3834090, cover: "/covers/yapyap.png" },
  { id: 86, name: "Super Meat Boy 3D", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré finit un niveau Light World", hardcore: "Joueur tiré finit un niveau Dark World", appid: 3288210, cover: "/covers/super-meat-boy-3d.jpg" },
  { id: 87, name: "Ultimate Godspeed", cat: "Racing", mode: "team", normal: "Win une course", hardcore: "Win 3 courses d'affilée", appid: 1435750 },
  { id: 88, name: "UpGun", cat: "Party", mode: "team", normal: "Win un round", hardcore: "Win 3 rounds d'affilée", appid: 1575870 },
  { id: 89, name: "Party Animals", cat: "Party", mode: "team", normal: "Win un match", hardcore: "Win 3 matchs d'affilée", appid: 1260320 },
  { id: 90, name: "Trials Rising", cat: "Racing", mode: "solo", normal: "Joueur tiré OR sur une piste", hardcore: "Joueur tiré OR sur une piste Extrême", appid: 641080 },
  { id: 91, name: "Slopecrashers", cat: "Sport", mode: "team", normal: "Win une descente", hardcore: "Win 3 descentes d'affilée", appid: 1619580 },
  { id: 92, name: "You Suck at Parking", cat: "Racing", mode: "solo", normal: "Joueur tiré finit un niveau", hardcore: "Joueur tiré 3 étoiles sur un niveau", appid: 837880 },
  { id: 93, name: "Hot Wheels Unleashed", cat: "Racing", mode: "team", normal: "Win une course", hardcore: "Win 3 courses d'affilée", appid: 1271700 },
  { id: 94, name: "Rocket Boots Mania", cat: "Racing", mode: "solo", normal: "Joueur tiré finit un niveau", hardcore: "Joueur tiré finit un niveau Extrême", appid: 942200 },
  { id: 95, name: "Street Fighter 6", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne 3 games d'affilée", appid: 1364780 },
  { id: 96, name: "Sea of Thieves", cat: "Coop", mode: "team", normal: "Finir un Tall Tale en coop", hardcore: "Couler un Skeleton Fort en coop", appid: 1172620 },
  { id: 97, name: "Age of Empires II", cat: "Coop", mode: "team", normal: "Win une partie 2v2", hardcore: "Win une partie 1v1 ranked", appid: 813780 },
  { id: 98, name: "Heave Ho", cat: "Party", mode: "team", normal: "Finir un niveau coop", hardcore: "Finir un niveau hard", appid: 905340 },
  { id: 99, name: "Valorant", cat: "FPS Compétitif", mode: "team", normal: "Win un Unrated en équipe", hardcore: "Win un match Compétitif", cover: "/covers/valorant.jpg" },
];

export function getCategories(): string[] {
 const set = new Set<string>();
 POOL.forEach((g) => set.add(g.cat));
 return ["all", ...Array.from(set).sort()];
}

export function effectiveMode(g: Game, difficulty: "normal" | "hardcore") {
 return g.soloHardcore && difficulty === "hardcore" ? "solo" : g.mode;
}
