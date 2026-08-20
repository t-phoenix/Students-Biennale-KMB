export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      about_sections: {
        Row: {
          body: string | null
          heading: string
          id: string
          published: boolean
          slug: string
          sort_order: number | null
        }
        Insert: {
          body?: string | null
          heading: string
          id: string
          published?: boolean
          slug: string
          sort_order?: number | null
        }
        Update: {
          body?: string | null
          heading?: string
          id?: string
          published?: boolean
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      artwork_contributors: {
        Row: {
          artwork_id: string
          dimensions: string | null
          display_name: string
          id: string
          institution_id: string | null
          institution_name: string | null
          materials: string | null
          person_id: string | null
          sort_order: number
        }
        Insert: {
          artwork_id: string
          dimensions?: string | null
          display_name: string
          id: string
          institution_id?: string | null
          institution_name?: string | null
          materials?: string | null
          person_id?: string | null
          sort_order?: number
        }
        Update: {
          artwork_id?: string
          dimensions?: string | null
          display_name?: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          materials?: string | null
          person_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "artwork_contributors_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_contributors_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_contributors_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          description: string | null
          dimensions_summary: string | null
          edition_id: string
          id: string
          materials_summary: string | null
          project_id: string
          published: boolean
          slug: string
          sort_order: number | null
          title: string
          venue_id: string | null
          zone_id: string | null
        }
        Insert: {
          description?: string | null
          dimensions_summary?: string | null
          edition_id: string
          id: string
          materials_summary?: string | null
          project_id: string
          published?: boolean
          slug: string
          sort_order?: number | null
          title: string
          venue_id?: string | null
          zone_id?: string | null
        }
        Update: {
          description?: string | null
          dimensions_summary?: string | null
          edition_id?: string
          id?: string
          materials_summary?: string | null
          project_id?: string
          published?: boolean
          slug?: string
          sort_order?: number | null
          title?: string
          venue_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artworks_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artworks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artworks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artworks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_links: {
        Row: {
          asset_id: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["asset_entity_type"]
          role: Database["public"]["Enums"]["asset_role"]
        }
        Insert: {
          asset_id: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["asset_entity_type"]
          role: Database["public"]["Enums"]["asset_role"]
        }
        Update: {
          asset_id?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["asset_entity_type"]
          role?: Database["public"]["Enums"]["asset_role"]
        }
        Relationships: [
          {
            foreignKeyName: "asset_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      award_winner_artists: {
        Row: {
          award_winner_id: string
          created_at: string
          id: string
          person_id: string
          sort_order: number
        }
        Insert: {
          award_winner_id: string
          created_at?: string
          id?: string
          person_id: string
          sort_order?: number
        }
        Update: {
          award_winner_id?: string
          created_at?: string
          id?: string
          person_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "award_winner_artists_award_winner_id_fkey"
            columns: ["award_winner_id"]
            isOneToOne: false
            referencedRelation: "award_winners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_winner_artists_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      award_winners: {
        Row: {
          active: boolean
          artwork_id: string
          created_at: string
          id: string
          programme_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          artwork_id: string
          created_at?: string
          id?: string
          programme_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          artwork_id?: string
          created_at?: string
          id?: string
          programme_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_winners_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_winners_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          alt_text: string | null
          bucket: string
          bytes: number | null
          created_at: string
          height: number | null
          id: string
          mime_type: string | null
          parent_asset_id: string | null
          public_url: string | null
          sha256: string | null
          sort_order: number
          source_label: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["asset_status"]
          storage_path: string
          updated_at: string
          variant: Database["public"]["Enums"]["asset_variant"]
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          bytes?: number | null
          created_at?: string
          height?: number | null
          id: string
          mime_type?: string | null
          parent_asset_id?: string | null
          public_url?: string | null
          sha256?: string | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_path: string
          updated_at?: string
          variant?: Database["public"]["Enums"]["asset_variant"]
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          bytes?: number | null
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          parent_asset_id?: string | null
          public_url?: string | null
          sha256?: string | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_path?: string
          updated_at?: string
          variant?: Database["public"]["Enums"]["asset_variant"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_snapshots: {
        Row: {
          edition_id: string
          generated_at: string
          payload: Json
          search_index: Json
        }
        Insert: {
          edition_id: string
          generated_at?: string
          payload: Json
          search_index?: Json
        }
        Update: {
          edition_id?: string
          generated_at?: string
          payload?: Json
          search_index?: Json
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_snapshots_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: true
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      edition_section_items: {
        Row: {
          content_type: string | null
          id: string
          label: string | null
          section_id: string
          sort_order: number
          url: string | null
        }
        Insert: {
          content_type?: string | null
          id: string
          label?: string | null
          section_id: string
          sort_order?: number
          url?: string | null
        }
        Update: {
          content_type?: string | null
          id?: string
          label?: string | null
          section_id?: string
          sort_order?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edition_section_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "edition_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      edition_sections: {
        Row: {
          body: string | null
          edition_id: string
          id: string
          section_key: Database["public"]["Enums"]["edition_section_key"]
          sort_order: number
          title: string | null
        }
        Insert: {
          body?: string | null
          edition_id: string
          id: string
          section_key: Database["public"]["Enums"]["edition_section_key"]
          sort_order?: number
          title?: string | null
        }
        Update: {
          body?: string | null
          edition_id?: string
          id?: string
          section_key?: Database["public"]["Enums"]["edition_section_key"]
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edition_sections_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      edition_venues: {
        Row: {
          edition_id: string
          venue_id: string
        }
        Insert: {
          edition_id: string
          venue_id: string
        }
        Update: {
          edition_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edition_venues_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edition_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          number: number
          overall_curatorial_note: string | null
          overview: string | null
          published: boolean
          slug: string
          title: string | null
          updated_at: string
          years: string
        }
        Insert: {
          created_at?: string
          id: string
          is_current?: boolean
          number: number
          overall_curatorial_note?: string | null
          overview?: string | null
          published?: boolean
          slug: string
          title?: string | null
          updated_at?: string
          years: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          number?: number
          overall_curatorial_note?: string | null
          overview?: string | null
          published?: boolean
          slug?: string
          title?: string | null
          updated_at?: string
          years?: string
        }
        Relationships: []
      }
      home_covers: {
        Row: {
          active: boolean
          artist: string | null
          artwork_name: string | null
          created_at: string
          id: string
          image_url: string
          institution: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          artist?: string | null
          artwork_name?: string | null
          created_at?: string
          id?: string
          image_url: string
          institution?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          artist?: string | null
          artwork_name?: string | null
          created_at?: string
          id?: string
          image_url?: string
          institution?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      import_sources: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          id: number
          imported_at: string
          source_ref: string | null
          source_type: string | null
        }
        Insert: {
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          imported_at?: string
          source_ref?: string | null
          source_type?: string | null
        }
        Update: {
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          imported_at?: string
          source_ref?: string | null
          source_type?: string | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          is_collective: boolean
          name: string
          slug: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id: string
          is_collective?: boolean
          name: string
          slug: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          is_collective?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      press_items: {
        Row: {
          body: string | null
          excerpt: string | null
          external_url: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          sort_order: number | null
          title: string
        }
        Insert: {
          body?: string | null
          excerpt?: string | null
          external_url?: string | null
          id: string
          published?: boolean
          published_at?: string | null
          slug: string
          sort_order?: number | null
          title: string
        }
        Update: {
          body?: string | null
          excerpt?: string | null
          external_url?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      programme_facilitators: {
        Row: {
          display_name: string | null
          person_id: string | null
          programme_id: string
          sort_order: number
        }
        Insert: {
          display_name?: string | null
          person_id?: string | null
          programme_id: string
          sort_order?: number
        }
        Update: {
          display_name?: string | null
          person_id?: string | null
          programme_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "programme_facilitators_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_facilitators_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_project_links: {
        Row: {
          programme_id: string
          project_id: string
        }
        Insert: {
          programme_id: string
          project_id: string
        }
        Update: {
          programme_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_project_links_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          awardees: string | null
          body: string | null
          dates: string | null
          host: string | null
          id: string
          place: string | null
          published: boolean
          slug: string
          sort_order: number | null
          state: Database["public"]["Enums"]["programme_state"]
          subtype: Database["public"]["Enums"]["programme_subtype"]
          summary: string | null
          title: string
        }
        Insert: {
          awardees?: string | null
          body?: string | null
          dates?: string | null
          host?: string | null
          id: string
          place?: string | null
          published?: boolean
          slug: string
          sort_order?: number | null
          state: Database["public"]["Enums"]["programme_state"]
          subtype: Database["public"]["Enums"]["programme_subtype"]
          summary?: string | null
          title: string
        }
        Update: {
          awardees?: string | null
          body?: string | null
          dates?: string | null
          host?: string | null
          id?: string
          place?: string | null
          published?: boolean
          slug?: string
          sort_order?: number | null
          state?: Database["public"]["Enums"]["programme_state"]
          subtype?: Database["public"]["Enums"]["programme_subtype"]
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          edition_id: string
          id: string
          project_number: number | null
          published: boolean
          sort_order: number | null
          title: string
          zone_id: string | null
        }
        Insert: {
          edition_id: string
          id: string
          project_number?: number | null
          published?: boolean
          sort_order?: number | null
          title: string
          zone_id?: string | null
        }
        Update: {
          edition_id?: string
          id?: string
          project_number?: number | null
          published?: boolean
          sort_order?: number | null
          title?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      search_entries: {
        Row: {
          edition_id: string | null
          entity_id: string
          entity_type: string
          field_artist: string | null
          field_curator: string | null
          field_edition: string | null
          field_institution: string | null
          field_programme: string | null
          field_title: string | null
          field_venue: string | null
          field_zone: string | null
          id: string
          route: string
          search_vector: unknown
          subtitle: string | null
          title: string
        }
        Insert: {
          edition_id?: string | null
          entity_id: string
          entity_type: string
          field_artist?: string | null
          field_curator?: string | null
          field_edition?: string | null
          field_institution?: string | null
          field_programme?: string | null
          field_title?: string | null
          field_venue?: string | null
          field_zone?: string | null
          id: string
          route: string
          search_vector?: unknown
          subtitle?: string | null
          title: string
        }
        Update: {
          edition_id?: string | null
          entity_id?: string
          entity_type?: string
          field_artist?: string | null
          field_curator?: string | null
          field_edition?: string | null
          field_institution?: string | null
          field_programme?: string | null
          field_title?: string | null
          field_venue?: string | null
          field_zone?: string | null
          id?: string
          route?: string
          search_vector?: unknown
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_entries_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      slugs: {
        Row: {
          edition_id: string | null
          entity_id: string
          entity_type: string
          slug: string
        }
        Insert: {
          edition_id?: string | null
          entity_id: string
          entity_type: string
          slug: string
        }
        Update: {
          edition_id?: string | null
          entity_id?: string
          entity_type?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "slugs_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          edition_id: string | null
          id: string
          name: string
          sort_order: number | null
          tier: string | null
          url: string | null
        }
        Insert: {
          edition_id?: string | null
          id: string
          name: string
          sort_order?: number | null
          tier?: string | null
          url?: string | null
        }
        Update: {
          edition_id?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tier?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      update_cards: {
        Row: {
          active: boolean
          body: string
          card_type: string
          created_at: string
          heading: string
          id: string
          image_url: string | null
          link_external: boolean
          link_url: string | null
          slot: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          card_type?: string
          created_at?: string
          heading: string
          id?: string
          image_url?: string | null
          link_external?: boolean
          link_url?: string | null
          slot: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          card_type?: string
          created_at?: string
          heading?: string
          id?: string
          image_url?: string | null
          link_external?: boolean
          link_url?: string | null
          slot?: number
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          history: string | null
          id: string
          map_url: string | null
          name: string
          slug: string
          sort_order: number | null
          virtual_tour_url: string | null
        }
        Insert: {
          history?: string | null
          id: string
          map_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          virtual_tour_url?: string | null
        }
        Update: {
          history?: string | null
          id?: string
          map_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          virtual_tour_url?: string | null
        }
        Relationships: []
      }
      zone_people: {
        Row: {
          individual_curatorial_note: string | null
          person_id: string
          role: Database["public"]["Enums"]["zone_person_role"]
          sort_order: number
          zone_id: string
        }
        Insert: {
          individual_curatorial_note?: string | null
          person_id: string
          role: Database["public"]["Enums"]["zone_person_role"]
          sort_order?: number
          zone_id: string
        }
        Update: {
          individual_curatorial_note?: string | null
          person_id?: string
          role?: Database["public"]["Enums"]["zone_person_role"]
          sort_order?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_people_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          common_curatorial_note: string | null
          edition_id: string
          id: string
          label: string | null
          number: number
          region: string | null
          sort_order: number | null
        }
        Insert: {
          common_curatorial_note?: string | null
          edition_id: string
          id: string
          label?: string | null
          number: number
          region?: string | null
          sort_order?: number | null
        }
        Update: {
          common_curatorial_note?: string | null
          edition_id?: string
          id?: string
          label?: string | null
          number?: number
          region?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_entities: {
        Args: { filter_edition_id?: string; q: string; result_limit?: number }
        Returns: {
          edition_id: string
          entity_id: string
          entity_type: string
          id: string
          matched_field: string
          matched_snippet: string
          rank: number
          route: string
          subtitle: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      asset_entity_type:
        | "artwork"
        | "project"
        | "person"
        | "venue"
        | "zone"
        | "edition"
        | "programme"
        | "press_item"
        | "about_section"
      asset_role:
        | "cover"
        | "gallery"
        | "portrait"
        | "map"
        | "hero"
        | "slider"
        | "download"
        | "logo"
      asset_status: "pending" | "processing" | "ready" | "failed"
      asset_variant: "original" | "thumbnail" | "card" | "hero" | "gallery"
      edition_section_key:
        | "overview"
        | "team"
        | "curators"
        | "curatorial_note"
        | "gallery"
        | "downloads"
        | "press"
        | "resources"
        | "custom"
      programme_state: "upcoming" | "past"
      programme_subtype:
        | "workshop"
        | "residency"
        | "national-award"
        | "international-award"
      zone_person_role: "curator" | "assistant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      asset_entity_type: [
        "artwork",
        "project",
        "person",
        "venue",
        "zone",
        "edition",
        "programme",
        "press_item",
        "about_section",
      ],
      asset_role: [
        "cover",
        "gallery",
        "portrait",
        "map",
        "hero",
        "slider",
        "download",
        "logo",
      ],
      asset_status: ["pending", "processing", "ready", "failed"],
      asset_variant: ["original", "thumbnail", "card", "hero", "gallery"],
      edition_section_key: [
        "overview",
        "team",
        "curators",
        "curatorial_note",
        "gallery",
        "downloads",
        "press",
        "resources",
        "custom",
      ],
      programme_state: ["upcoming", "past"],
      programme_subtype: [
        "workshop",
        "residency",
        "national-award",
        "international-award",
      ],
      zone_person_role: ["curator", "assistant"],
    },
  },
} as const
