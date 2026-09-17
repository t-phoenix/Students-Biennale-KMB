import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { CatalogueProvider } from "./lib/catalogue";
import { HomeCmsProvider } from "./lib/homeCms";
import { EDITIONS_PATH, LATEST_EDITION } from "./data/site";

const DiscoverArtworks = lazy(() =>
  import("./pages/DiscoverArtworks").then((m) => ({ default: m.DiscoverArtworks })),
);
const EditionShell = lazy(() =>
  import("./pages/EditionShell").then((m) => ({ default: m.EditionShell })),
);
const EditionOverview = lazy(() =>
  import("./pages/EditionOverview").then((m) => ({ default: m.EditionOverview })),
);
const CuratorsView = lazy(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.CuratorsView })),
);
const ArtworksView = lazy(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.ArtworksView })),
);
const ArtistsView = lazy(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.ArtistsView })),
);
const VenueView = lazy(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.VenueView })),
);
const Detail = lazy(() =>
  import("./pages/Detail").then((m) => ({ default: m.Detail })),
);
const Programmes = lazy(() =>
  import("./pages/Programmes").then((m) => ({ default: m.Programmes })),
);
const PastWorkshops = lazy(() =>
  import("./pages/PastWorkshops").then((m) => ({ default: m.PastWorkshops })),
);
const PastWorkshopDetail = lazy(() =>
  import("./pages/PastWorkshopDetail").then((m) => ({ default: m.PastWorkshopDetail })),
);
const RazaScholarship = lazy(() =>
  import("./pages/RazaScholarship").then((m) => ({ default: m.RazaScholarship })),
);
const Residencies = lazy(() =>
  import("./pages/Residencies").then((m) => ({ default: m.Residencies })),
);
const Press = lazy(() =>
  import("./pages/Press").then((m) => ({ default: m.Press })),
);
const Admin = lazy(() =>
  import("./pages/admin/Admin").then((m) => ({ default: m.Admin })),
);

function RouteFallback() {
  return <div className="route-fallback" aria-hidden="true" />;
}

export default function App() {
  return (
    <CatalogueProvider>
      <BrowserRouter>
        <HomeCmsProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="admin/*" element={<Admin />} />
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="artworks" element={<DiscoverArtworks />} />
                <Route path="archive" element={<Navigate to="/artworks" replace />} />
                <Route path="editions" element={<Navigate to={EDITIONS_PATH} replace />} />
                <Route path="editions/:yearId" element={<EditionShell />}>
                  <Route index element={<EditionOverview />} />
                  <Route path="curators" element={<CuratorsView />} />
                  <Route path="artworks" element={<ArtworksView />} />
                  <Route path="artists" element={<ArtistsView />} />
                  <Route path="venue" element={<VenueView />} />
                </Route>
                <Route path="editions/:yearId/:kindSeg/:id" element={<Detail />} />
                <Route path="programmes" element={<Programmes />} />
                <Route path="programmes/past-workshops" element={<PastWorkshops />} />
                <Route path="programmes/past-workshops/:id" element={<PastWorkshopDetail />} />
                <Route path="programmes/raza-scholarship" element={<RazaScholarship />} />
                <Route path="programmes/residencies" element={<Residencies />} />
                <Route path="press" element={<Press />} />
                <Route
                  path="about"
                  element={<Navigate to={{ pathname: "/", hash: "about" }} replace />}
                />
                <Route
                  path="*"
                  element={<Navigate to="/" replace state={{ from: LATEST_EDITION.id }} />}
                />
              </Route>
            </Routes>
          </Suspense>
          <SpeedInsights />
        </HomeCmsProvider>
      </BrowserRouter>
    </CatalogueProvider>
  );
}
