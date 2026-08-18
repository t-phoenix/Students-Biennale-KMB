import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { DiscoverArtworks } from "./pages/DiscoverArtworks";
import { EditionShell } from "./pages/EditionShell";
import { EditionOverview } from "./pages/EditionOverview";
import {
  ArtistsView,
  ArtworksView,
  CuratorsView,
  VenueView,
} from "./pages/EditionViews";
import { Detail } from "./pages/Detail";
import { Programmes } from "./pages/Programmes";
import { PastWorkshops } from "./pages/PastWorkshops";
import { PastWorkshopDetail } from "./pages/PastWorkshopDetail";
import { RazaScholarship } from "./pages/RazaScholarship";
import { Residencies } from "./pages/Residencies";
import { Press } from "./pages/Press";
import { CatalogueProvider } from "./lib/catalogue";
import { EDITIONS_PATH, LATEST_EDITION } from "./data/site";

export default function App() {
  return (
    <CatalogueProvider>
      <BrowserRouter>
        <Routes>
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
      </BrowserRouter>
    </CatalogueProvider>
  );
}
