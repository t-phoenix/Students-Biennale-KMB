import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { GalleryLightbox } from "../components/GalleryLightbox";
import "./Residencies.css";

const RESIDENCY = {
  title: "Students' Biennale National Residency Award Programme",
  host: "Kochi Biennale Foundation",
  period: "10 June – 10 July 2026",
  venue: "SMS Hall, Mattancherry, Kochi",
  awardees: "Reppandee Lepcha & Durgesh Prajapati",
  heroImage: "/programmes/residency-1.jpg",
  description: `As an extension of the Kochi Biennale Foundation's commitment to supporting emerging artistic practices beyond the exhibition period, the Foundation hosted two of the seven recipients of the Students' Biennale Tata Trusts National Awards through the KBF Residency Programme. Held from 10 June to 10 July 2026, the month-long residency provided the artists with dedicated studio space, accommodation, mentorship, research opportunities, and the freedom to develop new bodies of work through sustained engagement with Kochi and its surrounding regions.

Centred on research, experimentation, and process-led inquiry, the residency encouraged the artists to combine studio practice with site-responsive exploration. The programme included research visits to traditional pottery and weaving communities, artist studio visits, mentorship and critique sessions, public engagements, and independent time for experimentation and material development.

Research trips facilitated and organised by KBF included studio sessions with Sujith S.N. discussions with Bony Thomas, visits to the Save the Loom initiative, and studio critiques with Jithinlal N.R. and Ashwathy Gopalkrishnan.

The artists also visited V.K. Jayan's studio, Keezhmad Khadi & Village Industries (Aluva), Chendamangalam Handloom Weavers' Cooperative Society, Parthamangalam Pottery Village (Thrissur), Commonwealth Clay Tile Factory (Feroke), and local pottery workshops and markets across Mattancherry and Fort Kochi as part of their ground research.

Although both artists engaged with similar sites and material ecologies, their research developed in distinct directions. Reppandee Lepcha explored themes of material impermanence, identity, and inherited narratives through Broken Symphony, an installation combining jute, clay, water, text, and video. Durgesh Prajapati investigated Kerala's traditional pottery practices through field research and developed works examining the relationship between geography, craft, labour, and social transformation.

The residency concluded with a public Open Studio, where both artists presented their ongoing research and works-in-progress, fostering dialogue with artists, students, curators, and the wider public. Through place-based research, experimentation, and critical exchange, the residency enabled both awardees to meaningfully expand their practices while engaging deeply with Kerala's cultural and craft landscapes.`,
  galleryImages: [
    "/programmes/residency-1.jpg",
    "/programmes/residency-2.jpg",
    "/programmes/residency-3.jpg",
    "/programmes/residency-4.jpg",
    "/programmes/residency-5.jpg",
  ],
};

export function Residencies() {
  const root = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".residency-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="residencies">
      <div className="residencies__hero residency-reveal">
        <img src={RESIDENCY.heroImage} alt="" className="residencies__hero-img" />
      </div>

      <div className="fig-grid residencies__content residency-reveal">
        <div className="fig-c4-9">
          <h1 className="residencies__title">{RESIDENCY.title}</h1>
          <div className="residencies__meta">
            <dl>
              <dt>Host:</dt>
              <dd>{RESIDENCY.host}</dd>
              <dt>Period:</dt>
              <dd>{RESIDENCY.period}</dd>
              <dt>Venue:</dt>
              <dd>{RESIDENCY.venue}</dd>
              <dt>Awardees:</dt>
              <dd>{RESIDENCY.awardees}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="fig-grid residencies__description residency-reveal">
        <div className="fig-c4-9">
          <div className="residencies__text">
            {RESIDENCY.description.split("\n\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="residencies__gallery fig-grid residency-reveal">
        <div className="fig-c4-12">
          <div className="gallery-grid">
            {RESIDENCY.galleryImages.map((img, idx) => (
              <button
                key={idx}
                className="gallery-item"
                onClick={() => setLightboxIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                type="button"
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {lightboxIndex !== null ? (
        <GalleryLightbox
          images={RESIDENCY.galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}
