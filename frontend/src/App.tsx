import { useEffect, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Layout } from "./components/Layout";
import { SplashScreen } from "./components/SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Home } from "./pages/Home";
import { CatalogueProvider } from "./lib/catalogue";
import { HomeCmsProvider } from "./lib/homeCms";
import { SplashProvider } from "./lib/splash";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "./data/site";
import { lazyWithRetry, registerVitePreloadErrorHandler } from "./lib/lazyRetry";

const DiscoverArtworks = lazyWithRetry(() =>
  import("./pages/DiscoverArtworks").then((m) => ({ default: m.DiscoverArtworks })),
);
const EditionShell = lazyWithRetry(() =>
  import("./pages/EditionShell").then((m) => ({ default: m.EditionShell })),
);
const EditionOverview = lazyWithRetry(() =>
  import("./pages/EditionOverview").then((m) => ({ default: m.EditionOverview })),
);
const CuratorsView = lazyWithRetry(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.CuratorsView })),
);
const ArtworksView = lazyWithRetry(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.ArtworksView })),
);
const ArtistsView = lazyWithRetry(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.ArtistsView })),
);
const VenueView = lazyWithRetry(() =>
  import("./pages/EditionViews").then((m) => ({ default: m.VenueView })),
);
const Detail = lazyWithRetry(() =>
  import("./pages/Detail").then((m) => ({ default: m.Detail })),
);
const Programmes = lazyWithRetry(() =>
  import("./pages/Programmes").then((m) => ({ default: m.Programmes })),
);
const PastWorkshopDetail = lazyWithRetry(() =>
  import("./pages/PastWorkshopDetail").then((m) => ({ default: m.PastWorkshopDetail })),
);
const RazaScholarship = lazyWithRetry(() =>
  import("./pages/RazaScholarship").then((m) => ({ default: m.RazaScholarship })),
);
const Residencies = lazyWithRetry(() =>
  import("./pages/Residencies").then((m) => ({ default: m.Residencies })),
);
const Press = lazyWithRetry(() =>
  import("./pages/Press").then((m) => ({ default: m.Press })),
);
const Admin = lazyWithRetry(() =>
  import("./pages/admin/Admin").then((m) => ({ default: m.Admin })),
);

function RouteFallback() {
  return <div className="route-fallback" aria-hidden="true" />;
}

export default function App() {
  useEffect(() => {
    return registerVitePreloadErrorHandler();
  }, []);

  return (
    <CatalogueProvider>
      <BrowserRouter>
        <HomeCmsProvider>
          <SplashProvider>
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="admin/*" element={<Admin />} />
                  <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="artworks" element={<DiscoverArtworks />} />
                    <Route path="archive" element={<Navigate to="/artworks" replace />} />
                    <Route path="editions" element={<Navigate to={`/editions/${PREVIOUS_EDITIONS[0]}`} replace />} />
                    <Route path="editions/:yearId" element={<EditionShell />}>
                      <Route index element={<EditionOverview />} />
                      <Route path="curators" element={<CuratorsView />} />
                      <Route path="artworks" element={<ArtworksView />} />
                      <Route path="artists" element={<ArtistsView />} />
                      <Route path="venue" element={<VenueView />} />
                    </Route>
                    <Route path="editions/:yearId/:kindSeg/:id" element={<Detail />} />
                    <Route path="programmes" element={<Programmes />} />
                    <Route
                      path="programmes/past-workshops"
                      element={<Navigate to={{ pathname: "/programmes", hash: "past-workshops" }} replace />}
                    />
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
            </ErrorBoundary>
            <SplashScreen />
            <SpeedInsights />
          </SplashProvider>
        </HomeCmsProvider>
      </BrowserRouter>
    </CatalogueProvider>
  );
}
