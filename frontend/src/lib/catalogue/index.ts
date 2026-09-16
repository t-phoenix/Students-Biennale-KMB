export { CatalogueProvider } from "./provider";
export { useAllArtworks, useCatalogue, useEditionCatalogue } from "./hooks";
export {
  hasSearchResults,
  isSparseCatalogue,
  matchEditionMeta,
  matchesQuery,
  searchEditionCatalog,
  type EditionMetaMatch,
  type EditionSearchResults,
  type SearchHit,
  type SearchHitKind,
} from "./search";
export {
  artworkDetailPath,
  artworksForNavScope,
  artworksForVenueIn,
  artworksForZoneIn,
  curatorsForArtworkIn,
  findCard,
  parseArtworkNavScope,
  type ArtworkNavScope,
} from "./mappers";
export type { MappedCatalogue, SearchIndexEntry } from "./types";
