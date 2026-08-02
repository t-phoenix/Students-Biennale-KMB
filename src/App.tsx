import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function Placeholder({ title }: { title: string }) {
  return (
    <main style={{ padding: "var(--page-pad)" }}>
      <h1
        style={{
          fontSize: "var(--type-title-size)",
          lineHeight: "var(--type-title-line)",
          fontWeight: "var(--type-title-weight)",
          margin: 0,
        }}
      >
        {title}
      </h1>
      <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--spacing-md)" }}>
        Scaffold ready — Figma build next.
      </p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder title="Home" />} />
        <Route path="/artworks" element={<Placeholder title="Discover Artworks" />} />
        <Route path="/archive" element={<Navigate to="/artworks" replace />} />
        <Route path="/editions/*" element={<Placeholder title="Editions" />} />
        <Route path="/programmes" element={<Placeholder title="Programmes" />} />
        <Route path="/press" element={<Placeholder title="Press" />} />
        <Route path="/about" element={<Navigate to={{ pathname: "/", hash: "about" }} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
