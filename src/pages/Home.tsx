import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, withMotionPreference } from "../lib/motion";
import "./Home.css";

const HERO_UPDATES = [
  {
    title: "2027 - 28 UPDATE 01",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  },
  {
    title: "2027 - 28 UPDATE 02",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  },
  {
    title: "2027 - 28 UPDATE 03",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  },
];

const PRESS = [
  {
    title: "KBF Announces Curators For Students' Biennale 2025-26",
    date: "4 Dec 2025",
    excerpt:
      "The Kochi Biennale Foundation has announced the curators for Students' Biennale, a key educational initiative for emerging artists.",
  },
  {
    title: "The Ultimate Guide & Map to the Kochi-Muziris Biennale 2025/26 Venues",
    date: "15 Feb 2026",
  },
  {
    title: "St. Andrews Parish Hall - Students' Biennale at Kochi",
    date: "31 Mar 2026",
  },
];

export function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [expanded, setExpanded] = useState(true);

  useGSAP(
    () => {
      withMotionPreference({
        animate: () => {
          const cards = gsap.utils.toArray<HTMLElement>(".home-hero__card");
          gsap.from(cards, {
            autoAlpha: 0,
            y: 24,
            stagger: 0.12,
            duration: 0.6,
            ease: "power2.out",
          });

          const sections = gsap.utils.toArray<HTMLElement>(".home-section");
          sections.forEach((section) => {
            gsap.from(section, {
              autoAlpha: 0,
              y: 40,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 80%",
                once: true,
              },
            });
          });
        },
        onReduce: () => {
          gsap.set(".home-hero__card, .home-section", { autoAlpha: 1, y: 0 });
        },
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="home">
      <section className="home-hero" aria-label="Hero">
        <div className="home-hero__bg" />
        <div className="home-hero__cards">
          {HERO_UPDATES.map((item) => (
            <article key={item.title} className="home-hero__card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
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
        <div className="home-hero__credit">
          <p className="home-hero__artwork">Artwork Name</p>
          <p className="home-hero__artist">Artist Name</p>
          <p className="home-hero__inst">Institution</p>
        </div>
      </section>

      <section id="editions" className="home-section home-edition">
        <h2 className="home-section__label">Students' Biennale 2025–26</h2>
        <div className="home-edition__body">
          <p>
            The Students Biennale 2025-26 was realised by bringing together 70 projects under 4
            artist duos and 3 artist collectives taking on 7 curatorial frameworks which culminates
            into one exhibition. The programme emphasises collaborative learning, student-led
            curatorial agency, and interdisciplinary methodologies.
            {expanded ? (
              <>
                {" "}
                This edition, titled 'Sensing Grounds', opened to the public on Dec 13th 2025 across
                6 venues in Fort Kochi.
              </>
            ) : null}
          </p>
          <button type="button" className="home-text-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Read less..." : "Read more..."}
          </button>
        </div>
      </section>

      <section className="home-section home-sensing">
        <div className="home-sensing__title">
          <h2>Sensing Grounds</h2>
          <p>te(a)m-plurality, curatorial note by GABAA</p>
        </div>
        <div className="home-sensing__cols">
          <p>
            The workshop for the sixth edition of the Students' Biennale was to engage with students
            and circumstances—to perceive the world not from fixed, inherited positions, but through
            the fragile, shifting, and often contested sites where bodies, materials, and conditions
            converge with institutions.
          </p>
          <p>
            It is the "trembling, (shifting) space" where disobedient practices challenge and unsettle
            entrenched forms of authority. Students curate themselves; curators become collaborators.
          </p>
        </div>
        <div className="home-sensing__explore">
          <div className="home-sensing__links">
            <Link to="/editions/2025-26/curators">Curators</Link>
            <Link to="/editions/2025-26/artworks">Artworks</Link>
            <Link to="/editions/2025-26/venue">Venues</Link>
          </div>
          <Link className="home-cta" to="/editions/2025-26/curators">
            Explore Edition →
          </Link>
        </div>
      </section>

      <section id="programmes" className="home-section home-programmes">
        <h2 className="home-section__label">Upcoming Programmes</h2>
        <div className="home-programmes__panel">
          <div className="home-programmes__banner" />
          <div className="home-programmes__thumbs">
            <div className="home-programmes__thumb" />
            <div className="home-programmes__thumb" />
            <div className="home-programmes__thumb" />
          </div>
          <aside className="home-programmes__rail">
            <Link to="/programmes">Workshops</Link>
            <Link to="/programmes">Residencies</Link>
            <Link to="/programmes">AWARDS</Link>
          </aside>
        </div>
      </section>

      <section id="press" className="home-section home-press">
        <h2 className="home-section__label">Press</h2>
        <div className="home-press__featured">
          <div className="home-press__media" />
          <div>
            <p className="home-press__date">{PRESS[0].date}</p>
            <h3>{PRESS[0].title}</h3>
            <p>{PRESS[0].excerpt}</p>
            <Link to="/press?article=kbf-curators">Read more...</Link>
          </div>
        </div>
        <ul className="home-press__list">
          {PRESS.slice(1).map((item) => (
            <li key={item.title}>
              <Link to="/press">
                <span>{item.title}</span>
                <time>{item.date}</time>
              </Link>
            </li>
          ))}
        </ul>
        <Link className="home-cta home-cta--end" to="/press">
          view more →
        </Link>
      </section>

      <section id="about" className="home-section home-about">
        <h2 className="home-section__label">About Us</h2>
        <div className="home-about__block">
          <img src="/logo-kbf-text.png" alt="Kochi Biennale Foundation" />
          <p>
            The Kochi Biennale Foundation (KBF) was established in 2010 as a non-profit, charitable
            trust to promote art, culture, heritage, and education. Every two years, KBF hosts the
            Kochi-Muziris Biennale (KMB), India's first and largest contemporary art Biennale.
          </p>
        </div>
        <div className="home-about__block">
          <img src="/logo-sb-text.png" alt="Students' Biennale" />
          <p>
            Established by the Kochi Biennale Foundation in 2014, The Students' Biennale is the
            Foundation's flagship educational initiative and one of the most significant platforms
            for emerging artists in India.
          </p>
        </div>
        <div className="home-about__team">
          <h3>students' biennale 2026-27 Team</h3>
          <div className="home-about__team-cols">
            <p>
              Director of Programmes Mario D'Souza
              <br />
              Programme Managers Mashoor Ali M, Ananthan Suresh
            </p>
            <p>
              Production Managers Harshada Vijay, DC Charan
              <br />
              Accounts Manager Anzil Muhammed K
            </p>
            <p>Social Media and Catalogue Mishal MA</p>
          </div>
        </div>
        <div className="home-about__sponsors">
          <h3>sponsors</h3>
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
