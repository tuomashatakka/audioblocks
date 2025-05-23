export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audio_blocks: {
        Row: {
          audio_url: string | null
          created_at: string
          file_id: string | null
          id: string
          length_beats: number
          name: string
          pitch: number
          start_beat: number
          track_id: string
          updated_at: string
          version: number
          volume: number
          waveform_data: Json | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          file_id?: string | null
          id?: string
          length_beats: number
          name: string
          pitch?: number
          start_beat: number
          track_id: string
          updated_at?: string
          version?: number
          volume?: number
          waveform_data?: Json | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          file_id?: string | null
          id?: string
          length_beats?: number
          name?: string
          pitch?: number
          start_beat?: number
          track_id?: string
          updated_at?: string
          version?: number
          volume?: number
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_blocks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          alternate_greetings: string[] | null
          character_book: Json | null
          character_version: string | null
          created_at: string | null
          creator: string | null
          creator_notes: string | null
          description: string
          extensions: Json | null
          first_mes: string | null
          id: string
          mes_example: string | null
          name: string
          personality: string | null
          post_history_instructions: string | null
          scenario: string | null
          spec: string
          spec_version: string
          system_prompt: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          alternate_greetings?: string[] | null
          character_book?: Json | null
          character_version?: string | null
          created_at?: string | null
          creator?: string | null
          creator_notes?: string | null
          description: string
          extensions?: Json | null
          first_mes?: string | null
          id: string
          mes_example?: string | null
          name: string
          personality?: string | null
          post_history_instructions?: string | null
          scenario?: string | null
          spec?: string
          spec_version?: string
          system_prompt?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alternate_greetings?: string[] | null
          character_book?: Json | null
          character_version?: string | null
          created_at?: string | null
          creator?: string | null
          creator_notes?: string | null
          description?: string
          extensions?: Json | null
          first_mes?: string | null
          id?: string
          mes_example?: string | null
          name?: string
          personality?: string | null
          post_history_instructions?: string | null
          scenario?: string | null
          spec?: string
          spec_version?: string
          system_prompt?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          character_id: string | null
          content: string
          created_at: string | null
          id: string
          role: string
          story_id: string
        }
        Insert: {
          character_id?: string | null
          content: string
          created_at?: string | null
          id: string
          role: string
          story_id: string
        }
        Update: {
          character_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_settings: {
        Row: {
          bit_depth: number
          bpm: number
          created_at: string | null
          id: string
          project_id: string
          sample_rate: number
          time_signature: string
          updated_at: string | null
        }
        Insert: {
          bit_depth?: number
          bpm?: number
          created_at?: string | null
          id?: string
          project_id: string
          sample_rate?: number
          time_signature?: string
          updated_at?: string | null
        }
        Update: {
          bit_depth?: number
          bpm?: number
          created_at?: string | null
          id?: string
          project_id?: string
          sample_rate?: number
          time_signature?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bpm: number
          created_at: string
          id: string
          master_volume: number
          name: string
          settings: Json
          tracks: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bpm?: number
          created_at?: string
          id?: string
          master_volume?: number
          name: string
          settings?: Json
          tracks?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bpm?: number
          created_at?: string
          id?: string
          master_volume?: number
          name?: string
          settings?: Json
          tracks?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scenes: {
        Row: {
          chapter_number: number
          chapter_title: string
          created_at: string | null
          current_scene: string
          id: string
          present_characters: string[]
          story_id: string
          updated_at: string | null
        }
        Insert: {
          chapter_number: number
          chapter_title: string
          created_at?: string | null
          current_scene: string
          id: string
          present_characters: string[]
          story_id: string
          updated_at?: string | null
        }
        Update: {
          chapter_number?: number
          chapter_title?: string
          created_at?: string | null
          current_scene?: string
          id?: string
          present_characters?: string[]
          story_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          active_characters: string[]
          created_at: string | null
          genre: string | null
          id: string
          setting: string | null
          story_stage: number
          title: string
          updated_at: string | null
          user_character: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          active_characters: string[]
          created_at?: string | null
          genre?: string | null
          id: string
          setting?: string | null
          story_stage: number
          title: string
          updated_at?: string | null
          user_character?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          active_characters?: string[]
          created_at?: string | null
          genre?: string | null
          id?: string
          setting?: string | null
          story_stage?: number
          title?: string
          updated_at?: string | null
          user_character?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      timeline_markers: {
        Row: {
          color: string
          created_at: string | null
          created_by: string
          icon: string
          id: string
          label: string | null
          position: number
          project_id: string
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          created_by: string
          icon: string
          id?: string
          label?: string | null
          position: number
          project_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          created_by?: string
          icon?: string
          id?: string
          label?: string | null
          position?: number
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_markers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          armed: boolean
          color: string
          created_at: string
          id: string
          locked: boolean
          locked_by_name: string | null
          locked_by_user_id: string | null
          muted: boolean
          name: string
          project_id: string
          solo: boolean
          updated_at: string
          volume: number
        }
        Insert: {
          armed?: boolean
          color: string
          created_at?: string
          id?: string
          locked?: boolean
          locked_by_name?: string | null
          locked_by_user_id?: string | null
          muted?: boolean
          name: string
          project_id: string
          solo?: boolean
          updated_at?: string
          volume?: number
        }
        Update: {
          armed?: boolean
          color?: string
          created_at?: string
          id?: string
          locked?: boolean
          locked_by_name?: string | null
          locked_by_user_id?: string | null
          muted?: boolean
          name?: string
          project_id?: string
          solo?: boolean
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          cursor_position: Json | null
          id: string
          last_active: string
          locked_blocks: Json | null
          project_id: string
          user_id: string
        }
        Insert: {
          cursor_position?: Json | null
          id?: string
          last_active?: string
          locked_blocks?: Json | null
          project_id: string
          user_id: string
        }
        Update: {
          cursor_position?: Json | null
          id?: string
          last_active?: string
          locked_blocks?: Json | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          theme: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          theme?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          theme?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      websocket_messages: {
        Row: {
          created_at: string | null
          id: string
          message_type: string
          payload: Json
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_type: string
          payload: Json
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_type?: string
          payload?: Json
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "websocket_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      akeys: {
        Args: { "": unknown }
        Returns: string[]
      }
      avals: {
        Args: { "": unknown }
        Returns: string[]
      }
      create_demo_user: {
        Args: { username: string; password_hash: string }
        Returns: string
      }
      each: {
        Args: { hs: unknown }
        Returns: Record<string, unknown>[]
      }
      execute_safe_sql: {
        Args: { sql_string: string }
        Returns: string
      }
      ghstore_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ghstore_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ghstore_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ghstore_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      ghstore_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      google_id_to_uuid: {
        Args: { google_id: string }
        Returns: string
      }
      hstore: {
        Args: { "": string[] } | { "": Record<string, unknown> }
        Returns: unknown
      }
      hstore_hash: {
        Args: { "": unknown }
        Returns: number
      }
      hstore_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_send: {
        Args: { "": unknown }
        Returns: string
      }
      hstore_subscript_handler: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_to_array: {
        Args: { "": unknown }
        Returns: string[]
      }
      hstore_to_json: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_json_loose: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_jsonb_loose: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_matrix: {
        Args: { "": unknown }
        Returns: string[]
      }
      hstore_version_diag: {
        Args: { "": unknown }
        Returns: number
      }
      is_valid_uuid: {
        Args: { str: string }
        Returns: boolean
      }
      safe_create_schema: {
        Args: { schema_name: string }
        Returns: string
      }
      safe_create_table: {
        Args: { schema_name: string; table_name: string; table_def: string }
        Returns: string
      }
      skeys: {
        Args: { "": unknown }
        Returns: string[]
      }
      svals: {
        Args: { "": unknown }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
