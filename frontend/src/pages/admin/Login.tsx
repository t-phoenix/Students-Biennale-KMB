import { useState } from "react";
import type { FormEvent } from "react";
import "../../components/admin/admin-shared.css";
import { ThemeToggle } from "../../components/admin/ThemeToggle";

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function Login({ onSignIn, theme, onToggleTheme }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSignIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login" data-theme={theme}>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />

      <form className="adm-login__form" onSubmit={handleSubmit}>
        <div className="adm-login__brand">
          <img
            className="adm-login__brand-logo"
            src="/logo-sb-mark.svg"
            alt="Students' Biennale"
          />
          <span className="adm-login__brand-mark">CMS</span>
        </div>
        <h1 className="adm-login__title">Students' Biennale</h1>
        <p className="adm-login__sub">Sign in with your team account</p>

        {error && <div className="adm-login__error">{error}</div>}

        <div className="adm-field">
          <label className="adm-field__label">Email</label>
          <input
            className="adm-field__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="adm-field">
          <label className="adm-field__label">Password</label>
          <input
            className="adm-field__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="adm-btn adm-btn--primary"
          style={{ width: "100%", marginTop: 8 }}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
