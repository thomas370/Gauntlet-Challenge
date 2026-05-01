export function RulesBlock() {
  return (
    <aside className="rules" aria-label="Règles">
      <div className="rules-title">Règles</div>
      <ul>
        <li>Réussir l'objectif des <strong>10 jeux dans l'ordre</strong> sans une seule défaite.</li>
        <li>Pénalité au choix : <strong>reset complet</strong> (retour jeu 1) ou <strong>recule d'un jeu</strong>.</li>
        <li>Jeux <strong>solo</strong> — un seul joueur tiré au sort.</li>
        <li>Jeux <strong>duo</strong> — deux joueurs tirés au sort.</li>
        <li>Mode <strong>hardcore</strong> — objectifs nettement plus exigeants.</li>
        <li><strong>Re-roll</strong> — re-tire les jeux non épinglés.</li>
        <li><strong>Swap</strong> par carte — remplace un seul jeu.</li>
        <li>Progression et timer sauvegardés en local.</li>
      </ul>
    </aside>
  );
}
