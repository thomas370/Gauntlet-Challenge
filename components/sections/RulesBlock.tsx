export function RulesBlock() {
  return (
    <aside className="rules" aria-label="Règles">
      <div className="rules-title">// Règles du Gauntlet</div>
      <ul>
        <li>Vous devez réussir l'objectif des <strong>10 jeux dans l'ordre</strong> sans une seule défaite.</li>
        <li>Si l'objectif n'est pas atteint, deux pénalités au choix : <strong>Reset complet</strong> (retour jeu 1) ou <strong>Recule d'un jeu</strong>.</li>
        <li>Les jeux <strong>Solo</strong> doivent être réussis par un seul joueur tiré au sort.</li>
        <li>Les jeux <strong>Duo</strong> doivent être réussis par deux joueurs tirés au sort.</li>
        <li>Mode <strong>Hardcore</strong> — objectifs nettement plus exigeants.</li>
        <li>Re-roll — re-tire les jeux non épinglés tout en conservant les jeux pin.</li>
        <li>Swap par carte — remplace un seul jeu par un autre tiré au sort.</li>
        <li>La progression et le timer sont sauvegardés en local.</li>
      </ul>
    </aside>
  );
}
