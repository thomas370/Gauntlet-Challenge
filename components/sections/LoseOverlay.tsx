import { IconSkull } from "@/lib/icons-svg";

interface Props {
  message: string;
  onClose: () => void;
}

export function LoseOverlay({ message, onClose }: Props) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-card">
        <div className="overlay-eyebrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <IconSkull size={14} /> // Gauntlet failed
        </div>
        <h2 className="overlay-title" style={{ color: "var(--blood-2)" }}>Run brisée</h2>
        <p className="overlay-msg">{message}</p>
        <button className="btn btn-danger btn-lg" onClick={onClose} autoFocus>
          Repartir au combat
        </button>
      </div>
    </div>
  );
}
