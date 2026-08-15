import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion, withMotionPreference } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { SpotlightModal } from "../components/SpotlightModal";
import {
  EDITION_MORE,
  EDITION_SHORT,
  SENSING_GROUNDS_NOTE,
  TEAM_COLS,
} from "../data/editions";
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

export function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const editionMoreRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [editionExpanded, setEditionExpanded] = useState(false);
  const [sensingOpen, setSensingOpen] = useState(false);

  useGSAP(
    () => {
      const el = editionMoreRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { height: editionExpanded ? "auto" : 0 });
        return;
      }
      if (editionExpanded) {
        gsap.set(el, { height: "auto" });
        const target = el.offsetHeight;
        gsap.fromTo(
          el,
          { height: 0 },
          { height: target, duration: 0.45, ease: "power2.out" }
        );
      } else {
        gsap.to(el, { height: 0, duration: 0.32, ease: "power2.in" });
      }
    },
    { dependencies: [editionExpanded], scope: rootRef }
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
    <div ref={rootRef} className="home" data-node-id="6:1016">
      {/* Hero — full viewport width; overlays on 12-col (60 / 20) */}
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

        {/* Overlay sits on the page grid: update stack runs cols 1–3 plus the trailing
            gutter (335 at 1440), credit + dots on cols 10–12 (Figma 1:924 / 1:948) */}
        <div className="home-hero__grid">
          <div
            className="home-hero__stack fig-span3-plus-gutter"
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
                  <h2 className="home-hero__card-title">{item.label}</h2>
                  <p className="home-hero__card-body">{item.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="home-hero__meta">
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
          </div>
        </div>
      </section>

      <div className="home__main">
      {/* Edition intro — label cols 1–3, body cols 4–9 (Figma 1:955 / 1:956) */}
      <section id="editions" className="home-section home-edition">
        <div className="fig-grid">
          <h2 className="fig-label fig-heading">
            Students&apos; Biennale
            <br />
            2025–26
          </h2>
          <div className="home-edition__body fig-c4-9">
            {EDITION_SHORT.split("\n\n").map((p) => (
              <p key={p.slice(0, 40)} className="fig-body">
                {p}
              </p>
            ))}
            {/* Expands in place — no modal. This is an interim behaviour and is
                expected to change later. */}
            <div ref={editionMoreRef} className="home-edition__more" aria-hidden={!editionExpanded}>
              {EDITION_MORE.split("\n\n").map((p) => (
                <p key={p.slice(0, 40)} className="fig-body">
                  {p}
                </p>
              ))}
            </div>
            <button
              type="button"
              className="home-text-btn"
              aria-expanded={editionExpanded}
              onClick={() => setEditionExpanded((v) => !v)}
            >
              {editionExpanded ? "Read less..." : "Read more..."}
            </button>
          </div>
        </div>
      </section>

      {/* Sensing Grounds — links cols 1–3, wide cols 4–9, side cols 10–12; the peek
          bleeds into the right margin past col 12 (Figma 1:961) */}
      <section className="home-section home-sensing">
        <div className="fig-grid home-sensing__row">
          <nav className="home-sensing__links fig-rail" aria-label="Edition links">
            <button
              type="button"
              className="fig-subheading"
              onClick={() => setSensingOpen(true)}
            >
              Sensing Grounds
              <span className="fig-subheading__underline" aria-hidden />
            </button>
            <Link to="/editions/2025-26/curators" className="fig-subheading">
              Curators
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
            <Link to="/editions/2025-26/artworks" className="fig-subheading">
              Artworks
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
            <Link to="/editions/2025-26/venue" className="fig-subheading">
              Venues
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
          </nav>
          <div className="home-sensing__wide fig-c4-9">
            <img src="/home/sensing-wide.jpg" alt="" />
          </div>
          <div className="home-sensing__side fig-c10-12">
            <img src="/home/sensing-side.jpg" alt="" />
          </div>
          <div className="home-sensing__peek" aria-hidden>
            <img src="/home/sensing-wide.jpg" alt="" />
          </div>
        </div>
        <div className="fig-grid home-sensing__cta">
          <CtaLink
            className="fig-cta-end"
            to="/editions/2025-26"
            lines={["Explore", "Edition"]}
            spacing={["0.135em", "0.2em"]}
          />
        </div>
      </section>

      <SpotlightModal
        open={sensingOpen}
        onClose={() => setSensingOpen(false)}
        title={SENSING_GROUNDS_NOTE.title}
      >
        <p className="spotlight__attribution">{SENSING_GROUNDS_NOTE.attribution}</p>
        <div className="spotlight__body--split">
          {SENSING_GROUNDS_NOTE.paragraphs.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
        </div>
      </SpotlightModal>

      {/* Upcoming programmes — banner cols 4–12, thumbs 3-up at cols 4/7/10 (Figma 1:991) */}
      <section id="programmes" className="home-section home-programmes">
        <div className="fig-grid home-programmes__top">
          <h2 className="fig-label fig-heading">
            Upcoming
            <br />
            Programmes
          </h2>
          <div className="home-programmes__banner fig-c4-12">
            <img src="/home/programmes-banner.jpg" alt="" />
          </div>
        </div>
        <div className="fig-grid home-programmes__bottom">
          <div className="home-programmes__rail fig-rail">
            {(
              [
                { label: "Workshops", hash: "workshops" },
                { label: "Residencies", hash: "residencies" },
                { label: "AWARDS", hash: "awards" },
              ] as const
            ).map((tab) => (
              <Link
                key={tab.hash}
                to={`/programmes#${tab.hash}`}
                className="fig-subheading"
              >
                {tab.label}
                <span className="fig-subheading__underline" aria-hidden />
              </Link>
            ))}
          </div>
          <div className="home-programmes__thumbs fig-c4-12 fig-sub-3">
            <Link to="/programmes#workshops">
              <img src="/home/thumb-workshops.jpg" alt="" />
            </Link>
            <Link to="/programmes#residencies">
              <img src="/home/thumb-residencies.jpg" alt="" />
            </Link>
            <Link to="/programmes#awards">
              <img src="/home/thumb-awards.jpg" alt="" />
            </Link>
          </div>
        </div>
      </section>

      {/* Press — featured image cols 4–6, copy cols 7–12, list cols 4–12 (Figma 1:1005) */}
      <section id="press" className="home-section home-press">
        <div className="fig-grid">
          <h2 className="fig-label fig-heading">Press</h2>
          <img className="home-press__featured-img fig-c4-6" src="/home/press-featured.jpg" alt="" />
          <article className="home-press__featured fig-c7-12">
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
          <ul className="home-press__list fig-c4-12">
            {PRESS_LIST.map((item) => (
              <li key={item.title}>
                <Link to="/press">
                  <span>{item.title}</span>
                  <time>{item.date}</time>
                </Link>
              </li>
            ))}
          </ul>
          <CtaLink
            className="fig-cta-end home-press__more"
            to="/press"
            lines={["view", "more"]}
            spacing={["0.26em", "0.135em"]}
          />
        </div>
      </section>

      {/* About — logos in the label column, copy cols 4–9 (Figma 1:1060) */}
      <section id="about" className="home-section home-about">
        <div className="fig-grid home-about__intro">
          <h2 className="fig-label fig-heading">About Us</h2>
        </div>
        <div className="fig-grid home-about__block">
          <img
            className="home-about__logo-kbf fig-c1-3"
            src="/home/logo-kbf-about.svg"
            alt="Kochi Biennale Foundation"
            width={217}
            height={68}
          />
          <p className="fig-body fig-c4-9">
            The Kochi Biennale Foundation (KBF) was established in 2010 as a non-profit, charitable
            trust to promote art, culture, heritage, and education. Every two years, KBF hosts the
            Kochi-Muziris Biennale (KMB), India&apos;s first and largest contemporary art Biennale, in
            the historic port city of Kochi. It also actively contributes to the restoration and
            conservation of heritage properties and monuments, and the revival of traditional forms of
            art and culture. The Government of Kerala has been a principal supporter of the
            Foundation.
          </p>
        </div>
        <div className="fig-grid home-about__block">
          <div className="home-about__logo-sb fig-c1-3" aria-label="Students' Biennale">
            <img src="/home/logo-sb-mark-about.svg" alt="" width={72} height={100} />
            <img src="/home/logo-sb-word-about.svg" alt="Students' Biennale" width={120} height={48} />
          </div>
          <div className="home-about__sb-copy fig-c4-9">
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

        <div className="fig-grid home-about__team">
          <h3 className="fig-label fig-label--sub">
            students&apos; biennale
            <br />
            2026-27 Team
          </h3>
          <div className="home-about__team-cols fig-c4-12 fig-sub-3">
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

        <div className="fig-grid home-about__sponsors">
          <h3 className="fig-label fig-label--sub">sponsors</h3>
          <div className="home-about__sponsor-grid fig-c4-12 fig-sub-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="home-about__sponsor" />
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
