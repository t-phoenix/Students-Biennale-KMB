import { SpotlightModal } from "./SpotlightModal";
import { RAZA_SCHOLARS } from "../data/site";
import "./RazaSpotlightModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectScholar: (scholarId: string) => void;
};

const SCHOLAR_CAPTIONS: Record<string, string> = {
  "kaki-weiss":
    "Special participation - International Exchange Award supported by Institut Français India, Beaux Arts de Marseille and Kochi Biennale Foundation.",
  "nina-durel":
    "Special participation - International Exchange Award supported by Institut Français India, Beaux Arts de Marseille and Kochi Biennale Foundation.",
  "rutuja-sonawane":
    "Awarded the Raza-Students’ Biennale Scholarship - International Exchange Award supported by The Institut Français India, Raza Foundation, Beaux Arts de Marseille and Kochi Biennale Foundation.",
  "mohammad-riyaz":
    "Awarded the Raza-Students’ Biennale Scholarship - International Exchange Award supported by The Institut Français India, Raza Foundation, Beaux Arts de Marseille and Kochi Biennale Foundation.",
};

export function RazaSpotlightModal({ open, onClose, onSelectScholar }: Props) {
  return (
    <SpotlightModal
      open={open}
      onClose={onClose}
      title={"STUDENTS’ BIENNALE\n2025–26 X BEAUX\nARTS DE MARSEILLE"}
      attribution={"Raza - Students' Biennale Scholarship"}
    >
      <div className="raza-modal__editorial fig-sub-2">
        <div className="raza-modal__col">
          <p>
            The 2025-26 edition marked the launch of a new, first-of-its-kind collaborative
            exchange between the Students&apos; Biennale and Beaux-Arts de Marseille; a two-phase,
            reciprocal residency model designed to build sustained artistic dialogue between
            India and France.
          </p>
          <p>
            In the first phase, Kaki Weiss and Nina Durel, selected through an open call at
            Beaux-Arts de Marseille, travelled to Kochi for a two-week residency from 1-15
            December 2025, supported jointly by the French Institute in India (IFI), the
            Kochi Biennale Foundation, and Beaux-Arts de Marseille. During their residency, they
            created new work in dialogue with the city and the wider cohort of participating
            student artists, which was exhibited as part of the 2025-26 Students&apos; Biennale.
          </p>
        </div>
        <div className="raza-modal__col">
          <p>
            The exchange then turned outward: from among the participants of the Students&apos;
            Biennale, two Indian artists were selected for a fully-funded, residency-like
            semester in Marseille — the second and reciprocal half of the exchange. Following a
            rigorous two-month selection process by an independent jury, Rutuja Sonawane and
            Mohammad Riyaz were chosen from among 183 participants in the 2025-26 edition.
            Supported by IFI, the Raza Foundation, and Beaux-Arts de Marseille, this second
            phase has come to be known as the Raza-Students&apos; Biennale Scholarship.
          </p>
          <p>
            Together, these two phases form a complete, reciprocal cycle of exchange and in
            doing so, the programme aims to establish an ongoing structure for mobility,
            research, and cross-cultural learning ensuring the Students&apos; Biennale&apos;s
            reach extends well beyond Kochi.
          </p>
        </div>
      </div>

      <div className="raza-modal__scholars fig-sub-2">
        {RAZA_SCHOLARS.map((scholar) => (
          <article key={scholar.id} className="raza-modal__scholar-card">
            <button
              type="button"
              className="raza-modal__scholar-btn"
              onClick={() => onSelectScholar(scholar.id)}
              aria-label={`View artwork by ${scholar.name}`}
            >
              <div className="raza-modal__scholar-media">
                <img src={scholar.image} alt={scholar.name} />
              </div>
              <h3 className="raza-modal__scholar-name">{scholar.name}</h3>
            </button>
            <p className="raza-modal__scholar-caption">
              {SCHOLAR_CAPTIONS[scholar.id]}
            </p>
          </article>
        ))}
      </div>
    </SpotlightModal>
  );
}
