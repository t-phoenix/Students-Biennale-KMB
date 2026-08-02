import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, withMotionPreference } from "../lib/motion";
import { SpotlightModal } from "../components/SpotlightModal";
import "./Home.css";

const UPDATES = [
  {
    id: "u1",
    edition: "2027–28",
    label: "Update 01",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966",
  },
  {
    id: "u2",
    edition: "2027–28",
    label: "Update 02",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966",
  },
  {
    id: "u3",
    edition: "2027–28",
    label: "Update 03",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966",
  },
] as const;

const EDITION_SHORT = `The Students Biennale 2025-26 was realised by bringing together  70 projects under 4 artist duos and and 3 artist's collectives taking on 7 curatorial frameworks which culminates into one exhibition. The programme has successfully been able to achieve this with the participation of more than 200 student artists selected from over 150+ art institutions across the country.

The programme emphasises on collaborative learning, student-led curatorial agency, and interdisciplinary methodologies. Rather than functioning as a static exhibition, the Students' Biennale operates as an evolving framework that facilitates dialogue, experimentation, and collective knowledge production, contributing to the development of emerging practitioners and alternative pedagogical models within contemporary art education.  Artistic works draw upon material practices, embodied knowledge systems, everyday objects, and technological experimentation to reflect on lived experience and systems of power.`;

const EDITION_MORE = `The 2025-26 Students' Biennale programme has emerged under the curatorial mentorship, workshops and reviews by mid-career curators with regional and international experience. These seven curatorial teams comprise of 4 artistic duos - Ashok Vish & Chinar Shah (Karnataka & Telangana), Khursheed Ahmad & Salman Bashir Baba (Himalayan Belt), Savyasachi Anju Prabir & Sukanya Deb (Gujarat, Goa, Rajasthan, Punjab, Delhi, Haryana) Seethal CP & Sudheesh Kottembram (Kerala, Tamil Nadu, Andhra Pradesh) and 3 artists collective -  Anga Art Collective (North eastern states), GABAA (West Bengal, Orissa, Uttar Pradesh, Chhattisgarh) & Secular Art Collective (Maharashtra, Bihar, Jharkhand, Madhya Pradesh).

This edition, titled 'Sensing Grounds' invited students to present ideas, works that are still underprogress, collaborations, and finished works along with material developed during the workshops, resulting in a total of 70 projects. The Students' Biennale opened to the public on Dec 13th 2025 and remained on display until 31st March 2026 across 6 venues in Fort Kochi: Vallabhdas Kanji Ltd. (VKL) Warehouse, BMS Warehouse, Arthshila Kochi, St. Andrews Parish Hall, Space Gallery, and David Hall.`;

const PRESS_LIST = [
  {
    title: "The Ultimate Guide & Map to the Kochi-Muziris Biennale 2025/26 Venues",
    date: "15 Feb 2026",
  },
  {
    title: "St. Andrews Parish Hall -Students' Biennale at Kochi",
    date: "31 Mar 2026",
  },
  { title: "A warm kind of panic", date: "31 Dec 2025" },
  { title: "The Power of the Peta / Honour", date: "31 Dec 2025" },
];

const TEAM_COLS = [
  [
    ["Director of Programmes", "Mario D'Souza"],
    ["Programme Managers", "Mashoor Ali M", "Ananthan Suresh"],
    ["Programmes Assistants", "Nikhita Thevanoor", "Maanav Jalan"],
  ],
  [
    ["Production Managers", "Harshada Vijay", "DC Charan"],
    ["Production Assistants", "Hiran Unnikrishnan", "Niyas Issahak"],
    ["Accounts Manager", "Anzil Muhammed K"],
  ],
  [["Social Media and Catalogue", "Mishal MA"]],
];

export function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [editionOpen, setEditionOpen] = useState(false);
  const [progTab, setProgTab] = useState<"Workshops" | "Residencies" | "AWARDS">(
    "Residencies"
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      let cleanupHero: (() => void) | undefined;

      withMotionPreference({
        animate: () => {
          gsap.from(".home-hero__card", {
            autoAlpha: 0,
            stagger: 0.08,
            duration: 0.45,
            ease: "power2.out",
            clearProps: "transform",
          });

          const slides = gsap.utils.toArray<HTMLElement>(".home-hero__slide");
          if (slides.length) {
            gsap.set(slides, { autoAlpha: 0 });
            gsap.set(slides[0], { autoAlpha: 1 });
            const tl = gsap.timeline({ repeat: -1 });
            slides.forEach((el, i) => {
              const next = slides[(i + 1) % slides.length];
              tl.to({}, { duration: 4 })
                .to(el, { autoAlpha: 0, duration: 0.6, ease: "power2.out" }, ">")
                .to(next, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, "<")
                .call(() => setSlide((i + 1) % slides.length));
            });
            const hero = root.querySelector<HTMLElement>(".home-hero");
            const pause = () => tl.pause();
            const play = () => tl.play();
            hero?.addEventListener("pointerenter", pause);
            hero?.addEventListener("pointerleave", play);
            hero?.addEventListener("focusin", pause);
            hero?.addEventListener("focusout", play);
            cleanupHero = () => {
              hero?.removeEventListener("pointerenter", pause);
              hero?.removeEventListener("pointerleave", play);
              hero?.removeEventListener("focusin", pause);
              hero?.removeEventListener("focusout", play);
            };
          }

          gsap.utils.toArray<HTMLElement>(".home-section").forEach((section) => {
            gsap.from(section, {
              autoAlpha: 0,
              y: 36,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: { trigger: section, start: "top 82%", once: true },
            });
          });
        },
        onReduce: () => {
          gsap.set(".home-hero__card, .home-section", { autoAlpha: 1, y: 0 });
          gsap.set(".home-hero__slide", { autoAlpha: 0 });
          gsap.set(".home-hero__slide:first-child", { autoAlpha: 1 });
        },
      });

      return () => cleanupHero?.();
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="home fig-page" data-node-id="6:1016">
      {/* Hero */}
      <section className="home-hero" aria-label="Hero">
        <div className="home-hero__slides" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <img
              key={i}
              className="home-hero__slide home-hero__bg"
              src="/home/hero.jpg"
              alt=""
            />
          ))}
        </div>
        <div
          className="home-hero__stack"
          data-node-id="17:309"
          tabIndex={0}
          aria-label="Edition updates. Hover or focus to expand."
        >
          {UPDATES.map((item, i) => (
            <article
              key={item.id}
              className="home-hero__card"
              style={{ zIndex: UPDATES.length - i }}
              data-offset={i}
            >
              <div className="home-hero__card-inner">
                <header className="home-hero__card-head">
                  <p className="home-hero__card-edition">{item.edition}</p>
                  <h2>{item.label}</h2>
                </header>
                <p className="home-hero__card-body">{item.body}</p>
                {i === 0 ? (
                  <p className="home-hero__card-count" aria-hidden>
                    {String(i + 1).padStart(2, "0")} / {String(UPDATES.length).padStart(2, "0")}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <div className="home-hero__credit">
          <p className="home-hero__artwork">
            Artwork
            <br />
            Name
          </p>
          <p className="home-hero__artist">Artist</p>
          <p className="home-hero__inst">Institution</p>
        </div>
        <div className="home-hero__dots" role="tablist" aria-label="Hero slides">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={slide === i}
              className={slide === i ? "is-active" : undefined}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* Edition intro */}
      <section id="editions" className="home-section home-edition">
        <div className="fig-row">
          <h2 className="fig-label">
            Students&apos; Biennale
            <br />
            2025–26
          </h2>
          <div className="home-edition__body">
            {EDITION_SHORT.split("\n\n").map((p) => (
              <p key={p.slice(0, 40)} className="fig-body">
                {p}
              </p>
            ))}
            <button
              type="button"
              className="home-text-btn"
              onClick={() => setEditionOpen(true)}
            >
              Read more...
            </button>
          </div>
        </div>
      </section>

      <SpotlightModal
        open={editionOpen}
        onClose={() => setEditionOpen(false)}
        title={`Students' Biennale\n2025–26`}
      >
        {[EDITION_SHORT, EDITION_MORE].join("\n\n").split("\n\n").map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
        <div className="spotlight__actions">
          <Link to="/editions/2025-26/curators" onClick={() => setEditionOpen(false)}>
            Explore Edition →
          </Link>
        </div>
      </SpotlightModal>

      {/* Sensing Grounds explore */}
      <section className="home-section home-sensing">
        <div className="home-sensing__row">
          <nav className="home-sensing__links" aria-label="Edition links">
            <span>Sensing Grounds</span>
            <Link to="/editions/2025-26/curators">Curators</Link>
            <Link to="/editions/2025-26/artworks">Artworks</Link>
            <Link to="/editions/2025-26/venue">Venues</Link>
          </nav>
          <div className="home-sensing__media">
            <div className="home-sensing__wide">
              <img src="/home/sensing-wide.jpg" alt="" />
            </div>
            <div className="home-sensing__side">
              <img src="/home/sensing-side.jpg" alt="" />
            </div>
            <div className="home-sensing__peek" aria-hidden>
              <img src="/home/sensing-wide.jpg" alt="" />
            </div>
          </div>
        </div>
        <Link className="home-cta" to="/editions/2025-26/curators">
          <span>
            Explore
            <br />
            Edition
          </span>
          <span className="home-cta__mark" aria-hidden>
            →
          </span>
        </Link>
      </section>

      {/* Upcoming programmes */}
      <section id="programmes" className="home-section home-programmes">
        <div className="fig-row home-programmes__top">
          <h2 className="fig-label">
            Upcoming
            <br />
            Programmes
          </h2>
          <div className="home-programmes__banner">
            <img src="/home/programmes-banner.jpg" alt="" />
          </div>
        </div>
        <div className="fig-row home-programmes__bottom">
          <div className="home-programmes__rail">
            {(["Workshops", "Residencies", "AWARDS"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={progTab === tab ? "is-active" : undefined}
                onClick={() => setProgTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="home-programmes__thumbs">
            <img src="/home/thumb-workshops.jpg" alt="" />
            <img src="/home/thumb-residencies.jpg" alt="" />
            <img src="/home/thumb-awards.jpg" alt="" />
          </div>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="home-section home-press">
        <div className="fig-row">
          <h2 className="fig-label">Press</h2>
          <div className="home-press__main">
            <article className="home-press__featured">
              <img src="/home/press-featured.jpg" alt="" />
              <div>
                <div className="home-press__featured-head">
                  <h3>KBF Announces Curators For Students&apos; Biennale 2025-26</h3>
                  <time>4 dec 2025</time>
                </div>
                <p>
                  The Kochi Biennale Foundation (KBF) has announced the curators for Students&apos;
                  Biennale, a key educational initiative of the Kochi Biennale Foundation for budding
                  young artists. The programme works with state-funded art colleges across India,
                  encouraging emerging artists to reflect on their practice and showcase their work
                  on an international stage.
                </p>
                <Link to="/press?article=kbf-curators" className="home-text-btn">
                  Read more...
                </Link>
              </div>
            </article>
            <ul className="home-press__list">
              {PRESS_LIST.map((item) => (
                <li key={item.title}>
                  <Link to="/press">
                    <span>{item.title}</span>
                    <time>{item.date}</time>
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="home-cta home-cta--end" to="/press">
              <span>
                view
                <br />
                more
              </span>
              <span className="home-cta__mark" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="home-section home-about">
        <div className="fig-row home-about__intro">
          <h2 className="fig-label">About Us</h2>
          <div />
        </div>
        <div className="fig-row home-about__block">
          <img
            className="home-about__logo-kbf"
            src="/home/logo-kbf-about.svg"
            alt="Kochi Biennale Foundation"
            width={217}
            height={68}
          />
          <p className="fig-body">
            The Kochi Biennale Foundation (KBF) was established in 2010 as a non-profit, charitable
            trust to promote art, culture, heritage, and education. Every two years, KBF hosts the
            Kochi-Muziris Biennale (KMB), India&apos;s first and largest contemporary art Biennale, in
            the historic port city of Kochi. It also actively contributes to the restoration and
            conservation of heritage properties and monuments, and the revival of traditional forms of
            art and culture. The Government of Kerala has been a principal supporter of the
            Foundation.
          </p>
        </div>
        <div className="fig-row home-about__block">
          <div className="home-about__logo-sb" aria-label="Students' Biennale">
            <img src="/home/logo-sb-mark-about.svg" alt="" width={72} height={100} />
            <img src="/home/logo-sb-word-about.svg" alt="Students' Biennale" width={120} height={48} />
          </div>
          <div className="home-about__sb-copy">
            <p className="fig-body">
              Established by the Kochi Biennale Foundation in 2014, The Students&apos; Biennale is the
              Kochi Biennale Foundation&apos;s flagship educational initiative and one of the most
              significant platforms for emerging artists in India.
            </p>
            <p className="fig-body">
              At its core, the Students&apos; Biennale is both an exhibition platform and an evolving
              educational initiative. Through exhibitions, workshops, residencies, mentorship
              programmes, public talks, research projects, awards, and international exchanges, it
              fosters dialogue, experimentation, and collaboration while supporting the professional
              and creative development of the next generation of artists.
            </p>
            <p className="fig-body">
              The Students&apos; Biennale runs parallel to each edition of the Kochi-Muziris Biennale
              since its inception. Conceived to complement and strengthen fine arts education, it
              provides students and recent graduates with the opportunity to exhibit their work
              within the context of an international contemporary art exhibition while engaging with
              artists, curators, educators, researchers, and audiences from around the world. It
              creates a space where artistic practice, critical inquiry, and learning converge,
              enabling emerging practitioners to develop their work beyond the boundaries of the
              classroom.
            </p>
            <p className="fig-body">
              Each edition brings together participants from art institutions across India through
              curatorial research, institutional collaborations, and open calls. By connecting
              diverse artistic practices and pedagogical approaches, the programme reflects the
              breadth of contemporary art education while encouraging students to engage with the
              social, cultural, political, and ecological questions of our time.
            </p>
            <p className="fig-body">
              More than an exhibition, the Students&apos; Biennale is a long-term commitment to art
              education. It seeks to build lasting relationships between students, institutions,
              educators, and the wider contemporary art community, creating opportunities for
              exchange, critical reflection, and collective learning. Through this sustained
              engagement, the programme continues to nurture emerging artistic voices while
              contributing to the future of contemporary art education in India and beyond.
            </p>
          </div>
        </div>

        <div className="fig-row home-about__team">
          <h3 className="fig-label fig-label--sub">
            students&apos; biennale
            <br />
            2026-27 Team
          </h3>
          <div className="home-about__team-cols">
            {TEAM_COLS.map((col, i) => (
              <div key={i}>
                {col.map(([role, ...people]) => (
                  <div key={role} className="home-about__role">
                    <strong>{role}</strong>
                    {people.map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="fig-row home-about__sponsors">
          <h3 className="fig-label fig-label--sub">sponsors</h3>
          <div className="home-about__sponsor-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="home-about__sponsor" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
