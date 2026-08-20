import { Link } from "react-router-dom";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <img src="/logo-kbf-text.svg" alt="Kochi Biennale Foundation" />
        <p>Kochi Biennale Foundation, Indian Chamber Centenary Building, Kochi.</p>
        <p>© Kochi Biennale Foundation</p>
        <p className="site-footer__credit">
          Web Design and Services
          <span>Abhinil Agarwal</span>
          <span>Anand Peter</span>
          <span>Prajesh MP</span>
          <span>Vishnulal CR</span>
        </p>
      </div>
      <div className="site-footer__col">
        <h3>KBF</h3>
        <Link to="/#about">About</Link>
        <a href="https://kochimuzirisbiennale.org/" target="_blank" rel="noreferrer">
          Kochi-Muziris Biennale
        </a>
        <Link to="/artworks">Discover Artworks</Link>
      </div>
      <div className="site-footer__col">
        <h3>Programmes</h3>
        <Link to="/editions">Editions</Link>
        <Link to="/programmes">Programmes</Link>
        <Link to="/press">Press</Link>
      </div>
      <div className="site-footer__col">
        <h3>Contact</h3>
        <a href="mailto:info@kochimuzirisbiennale.org">Contact Us</a>
        <Link to="/press">Media</Link>
      </div>
      <div className="site-footer__col">
        <h3>Legal</h3>
        <a href="#privacy">Privacy Policy</a>
        <a href="#newsletter">Newsletter</a>
      </div>
    </footer>
  );
}
