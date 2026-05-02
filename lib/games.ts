import type { Game } from "./types";

export const POOL: Game[] = [
 // BATTLE ROYALE
 { id: 1, name: "Fortnite", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Victory Royale (Top 1) en trio" },
 { id: 2, name: "Apex Legends", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Champion (Top 1) en trio" },
 { id: 3, name: "PUBG: Battlegrounds", cat: "Battle Royale", mode: "team", normal: "Top 10 en duo", hardcore: "Chicken Dinner (Top 1)" },
 { id: 4, name: "The Finals", cat: "Battle Royale", mode: "team", normal: "Win en Quick Cash trio", hardcore: "Win en Normal" },
 { id: 5, name: "Naraka: Bladepoint", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio" },
 { id: 6, name: "Super Animal Royale", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio" },
 { id: 7, name: "Fall Guys", cat: "Party", mode: "team", normal: "Atteindre la finale en escouade", hardcore: "Décrocher une COURONNE en escouade" },
 { id: 8, name: "Stumble Guys", cat: "Party", mode: "team", soloHardcore: true, normal: "Au moins 1 joueur dans le Top 5", hardcore: "Joueur tiré au sort GAGNE la partie" },
 { id: 9, name: "Crab Game", cat: "Party", mode: "team", soloHardcore: true, normal: "Au moins 1 joueur survit à la saison", hardcore: "Joueur tiré au sort GAGNE la saison" },
 { id: 10, name: "Geoguessr Battle Royale", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré au sort gagne 1 partie", hardcore: "Joueur tiré au sort gagne 3 parties d'affilée" },
 { id: 11, name: "MiniRoyale", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio" },
 { id: 12, name: "SUPERVIVE", cat: "Battle Royale", mode: "team", normal: "Top 10 en trio", hardcore: "Win en trio" },

 // FPS
 { id: 13, name: "Counter-Strike 2", cat: "FPS Compétitif", mode: "duo", normal: "2 joueurs tirés gagnent un match Wingman", hardcore: "2 joueurs tirés gagnent 2 Wingman d'affilée" },
 { id: 14, name: "Rainbow Six Siege", cat: "FPS Compétitif", mode: "team", normal: "Win une partie Quick Match", hardcore: "Win une partie Normal" },
 { id: 15, name: "Ready or Not", cat: "FPS Coop", mode: "team", normal: "Finir une mission en coop", hardcore: "Mission avec 0 morts civils" },
 { id: 16, name: "Team Fortress 2", cat: "FPS Compétitif", mode: "team", normal: "Win une partie de Payload", hardcore: "Win une partie de Payload" },
 { id: 17, name: "DOOM", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survie 20 minutes", hardcore: "Joueur tiré survie 30 minutes" },
 { id: 18, name: "Payday 2", cat: "FPS Coop", mode: "team", normal: "Réussir une mission", hardcore: "Réussir un mission en Death Sentence" },
 { id: 19, name: "Left 4 Dead 2", cat: "FPS Coop", mode: "team", normal: "Finir une zone", hardcore: "Finir 3 zone" },
 { id: 20, name: "Back 4 Blood", cat: "FPS Coop", mode: "team", normal: "Finir un zone", hardcore: "Finir 2 zone" },
 { id: 21, name: "Deep Rock Galactic", cat: "FPS Coop", mode: "team", normal: "Finir une mission Hazard 4", hardcore: "Finir une mission Hazard 5" },
 { id: 22, name: "Risk of Rain 2", cat: "FPS Coop", mode: "team", normal: "Faire 2 etages", hardcore: "Faire 4 etages" },

 // PARTY / COOP FUN
 { id: 23, name: "Rocket League", cat: "Sport", mode: "team", normal: "Win 2 matchs ranked", hardcore: "Win 5 match ranked" },
 { id: 24, name: "Overcooked! 2", cat: "Coop", mode: "team", normal: "3 étoiles sur un niveau Monde 5+", hardcore: "4 étoiles sur un niveau Monde 5+" },
 { id: 25, name: "Moving Out 2", cat: "Coop", mode: "team", normal: "Finir un niveau", hardcore: "All medals sur un niveau" },
 { id: 26, name: "Gang Beasts", cat: "Party", mode: "solo", normal: "un joueur tiré gagne la vague 2", hardcore: "Joueur tiré gagne les vague" },
 { id: 27, name: "Human Fall Flat", cat: "Coop", mode: "team", normal: "Finir un niveau coop", hardcore: "Speedrun un niveau (record team)" },
 { id: 28, name: "Move or Die", cat: "Party", mode: "team", soloHardcore: true, normal: "Win une partie", hardcore: "Joueur tiré gagne 5 rounds d'affilée" },
 { id: 29, name: "Ultimate Chicken Horse", cat: "Party", mode: "team", normal: "Atteindre 5 points", hardcore: "Atteindre 10 points" },
 { id: 30, name: "Golf With Your Friends", cat: "Party", mode: "team", soloHardcore: true, normal: "Win un parcours 18 trous", hardcore: "Joueur tiré au sort termine sous le par" },
 { id: 31, name: "Stick Fight: The Game", cat: "Party", mode: "solo", normal: "Joueur tiré gagne 1 round", hardcore: "Joueur tiré gagne 5 rounds d'affilée" },
 { id: 32, name: "SpeedRunners", cat: "Party", mode: "solo", normal: "Joueur tiré gagne une race", hardcore: "Joueur tiré gagne 3 races d'affilée" },
 { id: 33, name: "Tricky Towers", cat: "Party", mode: "solo", normal: "Joueur tiré gagne un match", hardcore: "Joueur tiré gagne 3 matchs d'affilée" },
 { id: 34, name: "PICO PARK", cat: "Coop", mode: "team", normal: "Finir un niveau", hardcore: "Finir un Final Stage" },
 { id: 35, name: "Boomerang Fu", cat: "Party", mode: "team", normal: "Win un match", hardcore: "Win 3 matchs d'affilée" },
 { id: 36, name: "Super Battle Golf", cat: "Party", mode: "team", normal: "Win un parcours", hardcore: "Win 3 parcours d'affilée" },
 { id: 37, name: "Golf It", cat: "Party", mode: "solo", normal: "Win un parcours 18 trous", hardcore: "Joueur tiré au sort termine sous le par" },
 { id: 38, name: "Cuphead", cat: "Coop", mode: "team", normal: "Battre un boss en coop", hardcore: "Battre un boss en Expert en coop" },

 // HORROR / DEDUCTION / COOP
 { id: 39, name: "Phasmophobia", cat: "Horror Coop", mode: "team", normal: "Identifier le ghost", hardcore: "Identifier le ghost en Nightmare" },
 { id: 40, name: "Lethal Company", cat: "Horror Coop", mode: "team", normal: "Acheter la premiére lune", hardcore: "Atteindre quota 3000+" },
 { id: 41, name: "R.E.P.O.", cat: "Horror Coop", mode: "team", normal: "Finir les 3 premiére room", hardcore: "Atteindre quota légendaire (lvl 10+)" },
 { id: 42, name: "Content Warning", cat: "Horror Coop", mode: "team", normal: "Obtenir 100k+ vues sur une vidéo", hardcore: "Atteindre le Star (3 jours all-time)" },
 { id: 43, name: "Buckshot Roulette", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré gagne une partie Multiplayer", hardcore: "Joueur tiré gagne en Double or Nothing" },

 // SURVIVAL / SANDBOX
 { id: 44, name: "Minecraft", cat: "Sandbox", mode: "team", normal: "Battre l'Ender Dragon en coop", hardcore: "Battre Wither + Ender Dragon" },
 { id: 45, name: "Raft", cat: "Survie", mode: "team", normal: "Survivre 20 minutes sans mourir", hardcore: "Survivre 30 minutes sans mourir" },
 { id: 46, name: "Peak", cat: "Survie", mode: "team", normal: "Faire le premier biome", hardcore: "Atteindre le 3 eme biome" },
 { id: 47, name: "Half Dead 2", cat: "Survie", mode: "team", normal: "S'échapper en coop", hardcore: "S'échapper en mode Hard" },

 // PUZZLE / NARRATIF
 { id: 48, name: "Portal 2", cat: "Puzzle", mode: "duo", normal: "2 joueurs tirés finissent une chambre coop avec un temps impatie", hardcore: "Finir un chapitre sans mourir" },
 { id: 49, name: "Escape Simulator", cat: "Puzzle", mode: "team", normal: "Finir une room en coop", hardcore: "Finir une room avant le temps de fin" },
 { id: 50, name: "Carry The Glass", cat: "Coop", mode: "duo", normal: "2 joueurs tirés finissent les 5 premier checkpoints avec 3 chances", hardcore: "2 joueurs tirés finissent les 5 premier Checkpoints sans casser le verre" },
 { id: 51, name: "Chained Together", cat: "Coop", mode: "team", normal: "Atteindre 500m avec 3 chances", hardcore: "Atteindre 1000m minimum" },

 // FIGHTING
 { id: 52, name: "Tekken 8", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un match Ranked", hardcore: "Joueur tiré gagne un match Ranked" },
 { id: 53, name: "Tekken 7", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un match Ranked", hardcore: "Joueur tiré gagne une Ranked" },
 { id: 54, name: "Mortal Kombat 1", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne une Ranked" },
 { id: 55, name: "Mortal Kombat 11", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne une Ranked" },
 { id: 56, name: "Street Fighter V", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne une Ranked" },
 { id: 57, name: "MultiVersus", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un 1v1 Ranked", hardcore: "Joueur tiré gagne 2 games un Ranked" },
 { id: 58, name: "Brawlhalla", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un 1v1 Ranked", hardcore: "Joueur tiré gagne un 1v1 Ranked" },
 { id: 59, name: "Injustice 2", cat: "Fighting", mode: "solo", normal: "Joueur tiré gagne un Ranked", hardcore: "Joueur tiré gagne 3 games d'affilée" },
 { id: 60, name: "Furi", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré bat un boss", hardcore: "Joueur tiré bat un boss en Furier" },

 // RACING / SPORT
 { id: 61, name: "Trackmania", cat: "Racing", mode: "duo", normal: "2 joueurs tirés gagnent un match Ranked", hardcore: "2 joueurs tirés gagnent 2 Ranked d'affilée" },
 { id: 62, name: "Wreckfest", cat: "Racing", mode: "team", soloHardcore: true, normal: "top 5 sur une course", hardcore: "Joueur tiré finit P1 sur une course" },
 { id: 63, name: "Riders Republic", cat: "Racing", mode: "team", normal: "Top 20 sur une mass race", hardcore: "Top 10 sur une mass race" },
 { id: 64, name: "Lonely Mountains: Downhill", cat: "Solo Champion", mode: "solo", normal: "Médaille OR sur une piste bleu", hardcore: "finir une piste noir en OR sur une piste" },
 { id: 65, name: "EA Sports FC 25", cat: "Sport", mode: "team", normal: "Win un match Pro Clubs", hardcore: "Win 2 Pro Clubs d'affilée" },
 { id: 66, name: "Rematch", cat: "Sport", mode: "team", normal: "Win un match", hardcore: "Win un match Ranked" },

 // RHYTHM / SOLO CHAMPION
 { id: 67, name: "Beat Saber", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré FC une map normal", hardcore: "Joueur tiré FC une map Expert+" },
 { id: 68, name: "OSU!", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré pass une map 3★+", hardcore: "Joueur tiré FC une map 5★+" },
 { id: 69, name: "A Dance of Fire and Ice", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré finit un niveau choisit", hardcore: "Joueur tiré finit un niveau personnalisé choisir" },
 { id: 70, name: "Celeste", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré finit 2 niveau choisit", hardcore: "Joueur tiré finit un chapitre B-Side" },

 // ROGUELITE / SOLO
 { id: 71, name: "Balatro", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré win une run avec une deck Aleatoire", hardcore: "Joueur tiré win en Stake Gold+ avec une deck Aleatoire" },
 { id: 72, name: "Megabonk", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survit 20 minutes", hardcore: "Joueur tiré win en mode hard" },
 { id: 73, name: "Brotato", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré franchit la vague 5", hardcore: "Joueur tiré franchit vague 10" },
 { id: 74, name: "Vampire Survivors", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survit 30 minutes", hardcore: "Joueur tiré survie 40 minutes" },
 { id: 75, name: "20 Minutes Till Dawn", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré survit 20 minutes", hardcore: "Joueur tiré finit un boss en hard" },
 { id: 76, name: "Timberman", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré atteint score 100+", hardcore: "Joueur tiré atteint score 250+" },

 // MOBA / TD
 { id: 77, name: "League of Legends", cat: "MOBA", mode: "team", normal: "Win une partie en Aram", hardcore: "Win une partie Ranked Flex" },
 { id: 78, name: "Artisan TD", cat: "Coop", mode: "solo", normal: "Un joueur tiré Finir un niveau en mode Normal", hardcore: "Un joueur tiré Finir un niveau en mode Vétérant" },

 // QUIZ / DIVERS
 { id: 79, name: "Qui veut gagner des millions", cat: "Solo Champion", mode: "solo", normal: "Joueur tiré atteint pallier 2", hardcore: "Joueur tiré gagne sans utiliser de joker" },
 { id: 80, name: "The Escapists", cat: "Coop", mode: "team", normal: "Réussir une évasion en coop", hardcore: "Évasion sans déclencher d'alarme" },
 { id: 81, name: "Final Sentence", cat: "Battle Royale", mode: "solo", normal: "Joueur tiré au sort Top 10 en Classic BR", hardcore: "Joueur tiré GAGNE une Classic BR ou un Duel" },

  // === ADDITIONS FROM EXCEL ===
  { id: 82, name: "Kallax", cat: "Coop", mode: "team", normal: "Finir un niveau", hardcore: "Finir un niveau hard" },
  { id: 83, name: "Micro works", cat: "Coop", mode: "team", normal: "Finir un niveau coop", hardcore: "Finir un niveau hard" },
];

export function getCategories(): string[] {
 const set = new Set<string>();
 POOL.forEach((g) => set.add(g.cat));
 return ["all", ...Array.from(set).sort()];
}

export function effectiveMode(g: Game, difficulty: "normal" | "hardcore") {
 return g.soloHardcore && difficulty === "hardcore" ? "solo" : g.mode;
}
