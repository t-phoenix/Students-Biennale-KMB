import { Link } from "react-router-dom";
import "./Footer.css";

const KMB_URL = "https://kochimuzirisbiennale.org/";
const GOOGLE_ARTS_URL = "https://artsandculture.google.com/partner/kochi-biennale";
const CROW_THEORY_URL = "https://www.thecrowtheory.com/";

const SOCIAL = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/kochibiennale/",
    icon: "/icons/social-instagram.svg",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/KochiMuzirisBiennale",
    icon: "/icons/social-facebook.svg",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/kochi-biennale-foundation---india",
    icon: "/icons/social-linkedin.svg",
  },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <a
          className="site-footer__logo"
          href={KMB_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Kochi Biennale Foundation"
        >
          <img
            src="/home/logo-kbf-about.svg"
            alt="Kochi Biennale Foundation"
            width={217}
            height={68}
          />
        </a>
        <p>
          Kochi Biennale Foundation, Indian Chamber Centenary Building, Indian Chamber Road,
          Mattancherry, Kochi, Kerala 682002, India
        </p>
        <p>All rights reserved to Kochi Biennale Foundation</p>
        <p>
          Designed by{" "}
          <a href={CROW_THEORY_URL} target="_blank" rel="noreferrer">
            The Crow Theory
          </a>
        </p>
      </div>

      <div className="site-footer__rule" aria-hidden="true" />

      <nav className="site-footer__nav" aria-label="Footer">
        <div className="site-footer__col">
          <p className="site-footer__title">KBF</p>
          <a href={KMB_URL} target="_blank" rel="noreferrer">
            Kochi-Muziris Biennale 2025–26
          </a>
          <Link to="/editions">Students&apos; Biennale Editions</Link>
        </div>

        <div className="site-footer__col">
          <Link to="/programmes" className="site-footer__title">
            Programmes
          </Link>
          <Link to="/press">Press / Updates</Link>
          <Link to="/artworks">Discover Artworks</Link>
          <a href={GOOGLE_ARTS_URL} target="_blank" rel="noreferrer">
            Google Arts &amp; Culture
          </a>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__title">Support</p>
          <a href="mailto:info@kochimuzirisbiennale.org">Contact Us</a>
          <div className="site-footer__social">
            {SOCIAL.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
              >
                <img src={item.icon} alt="" width={22} height={22} />
              </a>
            ))}
          </div>
        </div>
      </nav>
    </footer>
  );
}
