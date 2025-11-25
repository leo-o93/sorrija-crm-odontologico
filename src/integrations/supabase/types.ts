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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string | null
          patient_id: string | null
          procedure_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_id?: string | null
          procedure_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_id?: string | null
          procedure_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_user_id: string | null
          channel: string
          contact_type: string
          created_at: string | null
          evolution_instance: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          organization_id: string
          patient_id: string | null
          phone: string
          status: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          channel?: string
          contact_type: string
          created_at?: string | null
          evolution_instance?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          organization_id: string
          patient_id?: string | null
          phone: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          channel?: string
          contact_type?: string
          created_at?: string | null
          evolution_instance?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          organization_id?: string
          patient_id?: string | null
          phone?: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          integration_type: string
          organization_id: string
          settings: Json
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          integration_type: string
          organization_id: string
          settings?: Json
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          integration_type?: string
          organization_id?: string
          settings?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          channel: string
          created_at: string
          id: string
          interaction_date: string
          interaction_type: string
          lead_id: string
          outcome: string | null
          summary: string | null
          user_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type: string
          lead_id: string
          outcome?: string | null
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type?: string
          lead_id?: string
          outcome?: string | null
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          appointment_date: string | null
          budget_paid: number | null
          budget_total: number | null
          created_at: string
          evaluation_result: string | null
          first_contact_channel: string | null
          first_contact_date: string | null
          id: string
          interest_id: string | null
          name: string
          notes: string | null
          organization_id: string | null
          phone: string
          registration_date: string
          responsible_user_id: string | null
          scheduled: boolean
          scheduled_on_attempt: string | null
          second_contact_channel: string | null
          second_contact_date: string | null
          source_id: string | null
          status: string
          third_contact_channel: string | null
          third_contact_date: string | null
          updated_at: string
        }
        Insert: {
          appointment_date?: string | null
          budget_paid?: number | null
          budget_total?: number | null
          created_at?: string
          evaluation_result?: string | null
          first_contact_channel?: string | null
          first_contact_date?: string | null
          id?: string
          interest_id?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          phone: string
          registration_date?: string
          responsible_user_id?: string | null
          scheduled?: boolean
          scheduled_on_attempt?: string | null
          second_contact_channel?: string | null
          second_contact_date?: string | null
          source_id?: string | null
          status?: string
          third_contact_channel?: string | null
          third_contact_date?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string | null
          budget_paid?: number | null
          budget_total?: number | null
          created_at?: string
          evaluation_result?: string | null
          first_contact_channel?: string | null
          first_contact_date?: string | null
          id?: string
          interest_id?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string
          registration_date?: string
          responsible_user_id?: string | null
          scheduled?: boolean
          scheduled_on_attempt?: string | null
          second_contact_channel?: string | null
          second_contact_date?: string | null
          source_id?: string | null
          status?: string
          third_contact_channel?: string | null
          third_contact_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content_text: string | null
          conversation_id: string
          created_at: string | null
          created_by_user_id: string | null
          delivered_at: string | null
          direction: string
          id: string
          media_url: string | null
          provider_message_id: string | null
          raw_payload: Json | null
          read_at: string | null
          sent_at: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content_text?: string | null
          conversation_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          delivered_at?: string | null
          direction: string
          id?: string
          media_url?: string | null
          provider_message_id?: string | null
          raw_payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content_text?: string | null
          conversation_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          delivered_at?: string | null
          direction?: string
          id?: string
          media_url?: string | null
          provider_message_id?: string | null
          raw_payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          is_owner: boolean | null
          organization_id: string
          role_in_org: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          organization_id: string
          role_in_org?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          organization_id?: string
          role_in_org?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          active: boolean
          address: string | null
          allergies: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          lead_id: string | null
          medical_history: string | null
          medications: string | null
          name: string
          notes: string | null
          organization_id: string | null
          phone: string
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          lead_id?: string | null
          medical_history?: string | null
          medications?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          phone: string
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          lead_id?: string | null
          medical_history?: string | null
          medications?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          active: boolean
          category: string
          created_at: string
          default_price: number | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          active: boolean
          channel: string
          created_at: string
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          active?: boolean
          channel: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          active?: boolean
          channel?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          headers: Json | null
          id: string
          ip_address: string | null
          method: string
          origin: string | null
          path: string | null
          payload: Json
          processed_at: string | null
          query_params: Json | null
          search_vector: unknown
          status: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          ip_address?: string | null
          method?: string
          origin?: string | null
          path?: string | null
          payload: Json
          processed_at?: string | null
          query_params?: Json | null
          search_vector?: unknown
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          ip_address?: string | null
          method?: string
          origin?: string | null
          path?: string | null
          payload?: Json
          processed_at?: string | null
          query_params?: Json | null
          search_vector?: unknown
          status?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_webhooks: { Args: never; Returns: undefined }
      get_user_organization_ids: {
        Args: { _user_id?: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "comercial" | "recepcao" | "dentista"
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
  public: {
    Enums: {
      app_role: ["admin", "gerente", "comercial", "recepcao", "dentista"],
    },
  },
} as const
