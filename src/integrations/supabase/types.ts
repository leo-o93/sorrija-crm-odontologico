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
      ai_suggestions: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          suggestion_data: Json
          suggestion_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          organization_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggestion_data?: Json
          suggestion_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          organization_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggestion_data?: Json
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
      crm_settings: {
        Row: {
          aguardando_to_cold_hours: number | null
          automation_mode: string | null
          awaiting_response_minutes: number | null
          created_at: string | null
          default_follow_up_interval: number | null
          em_conversa_timeout_minutes: number | null
          enable_auto_substatus: boolean | null
          enable_auto_temperature: boolean | null
          enable_automation: boolean | null
          enable_cold_lead_alerts: boolean | null
          enable_follow_up_alerts: boolean | null
          enable_no_show_alerts: boolean | null
          enable_substatus_timeout: boolean | null
          hot_to_cold_minutes: number | null
          id: string
          max_follow_up_attempts: number | null
          new_to_cold_minutes: number | null
          organization_id: string
          updated_at: string | null
          use_ai_for_unmatched: boolean | null
        }
        Insert: {
          aguardando_to_cold_hours?: number | null
          automation_mode?: string | null
          awaiting_response_minutes?: number | null
          created_at?: string | null
          default_follow_up_interval?: number | null
          em_conversa_timeout_minutes?: number | null
          enable_auto_substatus?: boolean | null
          enable_auto_temperature?: boolean | null
          enable_automation?: boolean | null
          enable_cold_lead_alerts?: boolean | null
          enable_follow_up_alerts?: boolean | null
          enable_no_show_alerts?: boolean | null
          enable_substatus_timeout?: boolean | null
          hot_to_cold_minutes?: number | null
          id?: string
          max_follow_up_attempts?: number | null
          new_to_cold_minutes?: number | null
          organization_id: string
          updated_at?: string | null
          use_ai_for_unmatched?: boolean | null
        }
        Update: {
          aguardando_to_cold_hours?: number | null
          automation_mode?: string | null
          awaiting_response_minutes?: number | null
          created_at?: string | null
          default_follow_up_interval?: number | null
          em_conversa_timeout_minutes?: number | null
          enable_auto_substatus?: boolean | null
          enable_auto_temperature?: boolean | null
          enable_automation?: boolean | null
          enable_cold_lead_alerts?: boolean | null
          enable_follow_up_alerts?: boolean | null
          enable_no_show_alerts?: boolean | null
          enable_substatus_timeout?: boolean | null
          hot_to_cold_minutes?: number | null
          id?: string
          max_follow_up_attempts?: number | null
          new_to_cold_minutes?: number | null
          organization_id?: string
          updated_at?: string | null
          use_ai_for_unmatched?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          organization_id: string | null
          type: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          organization_id?: string | null
          type: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          period_end: string
          period_start: string
          period_type: string
          target_amount: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          period_end: string
          period_start: string
          period_type: string
          target_amount: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          target_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          patient_id: string | null
          payment_date: string | null
          payment_method_id: string | null
          quote_id: string | null
          status: string
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          quote_id?: string | null
          status?: string
          transaction_date?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          quote_id?: string | null
          status?: string
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
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
      interest_triggers: {
        Row: {
          action_set_interest_id: string | null
          action_set_source_id: string | null
          action_set_status: string | null
          action_set_temperature: string | null
          active: boolean | null
          case_sensitive: boolean | null
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string | null
          id: string
          name: string
          organization_id: string
          priority: number | null
        }
        Insert: {
          action_set_interest_id?: string | null
          action_set_source_id?: string | null
          action_set_status?: string | null
          action_set_temperature?: string | null
          active?: boolean | null
          case_sensitive?: boolean | null
          condition_field: string
          condition_operator: string
          condition_value?: string
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          priority?: number | null
        }
        Update: {
          action_set_interest_id?: string | null
          action_set_source_id?: string | null
          action_set_status?: string | null
          action_set_temperature?: string | null
          active?: boolean | null
          case_sensitive?: boolean | null
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interest_triggers_action_set_interest_id_fkey"
            columns: ["action_set_interest_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_triggers_action_set_source_id_fkey"
            columns: ["action_set_source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_triggers_organization_id_fkey"
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
      lead_statuses: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          position: number
          title: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          position?: number
          title: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_statuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_temperatures: {
        Row: {
          active: boolean | null
          auto_transition_days: number | null
          auto_transition_to: string | null
          color: string
          created_at: string | null
          icon: string
          id: string
          is_default: boolean | null
          is_system: boolean | null
          name: string
          organization_id: string
          position: number | null
          title: string
        }
        Insert: {
          active?: boolean | null
          auto_transition_days?: number | null
          auto_transition_to?: string | null
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name: string
          organization_id: string
          position?: number | null
          title: string
        }
        Update: {
          active?: boolean | null
          auto_transition_days?: number | null
          auto_transition_to?: string | null
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name?: string
          organization_id?: string
          position?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_temperatures_auto_transition_to_fkey"
            columns: ["auto_transition_to"]
            isOneToOne: false
            referencedRelation: "lead_temperatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_temperatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          appointment_date: string | null
          automation_enabled: boolean | null
          budget_paid: number | null
          budget_total: number | null
          created_at: string
          evaluation_result: string | null
          first_contact_channel: string | null
          first_contact_date: string | null
          follow_up_count: number | null
          hot_substatus: string | null
          id: string
          interest_id: string | null
          last_follow_up_date: string | null
          last_interaction_at: string | null
          lost_reason: string | null
          name: string
          next_follow_up_date: string | null
          no_show_count: number | null
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
          temperature: string | null
          third_contact_channel: string | null
          third_contact_date: string | null
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          appointment_date?: string | null
          automation_enabled?: boolean | null
          budget_paid?: number | null
          budget_total?: number | null
          created_at?: string
          evaluation_result?: string | null
          first_contact_channel?: string | null
          first_contact_date?: string | null
          follow_up_count?: number | null
          hot_substatus?: string | null
          id?: string
          interest_id?: string | null
          last_follow_up_date?: string | null
          last_interaction_at?: string | null
          lost_reason?: string | null
          name: string
          next_follow_up_date?: string | null
          no_show_count?: number | null
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
          temperature?: string | null
          third_contact_channel?: string | null
          third_contact_date?: string | null
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string | null
          automation_enabled?: boolean | null
          budget_paid?: number | null
          budget_total?: number | null
          created_at?: string
          evaluation_result?: string | null
          first_contact_channel?: string | null
          first_contact_date?: string | null
          follow_up_count?: number | null
          hot_substatus?: string | null
          id?: string
          interest_id?: string | null
          last_follow_up_date?: string | null
          last_interaction_at?: string | null
          lost_reason?: string | null
          name?: string
          next_follow_up_date?: string | null
          no_show_count?: number | null
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
          temperature?: string | null
          third_contact_channel?: string | null
          third_contact_date?: string | null
          triggered_by?: string | null
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
          {
            foreignKeyName: "leads_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "interest_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      lid_phone_mapping: {
        Row: {
          created_at: string | null
          lid_id: string
          organization_id: string
          phone: string
        }
        Insert: {
          created_at?: string | null
          lid_id: string
          organization_id: string
          phone: string
        }
        Update: {
          created_at?: string | null
          lid_id?: string
          organization_id?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "lid_phone_mapping_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean | null
          attempt_number: number | null
          category: string
          content: string
          created_at: string | null
          id: string
          interest_id: string | null
          name: string
          organization_id: string
          temperature: string | null
        }
        Insert: {
          active?: boolean | null
          attempt_number?: number | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          interest_id?: string | null
          name: string
          organization_id: string
          temperature?: string | null
        }
        Update: {
          active?: boolean | null
          attempt_number?: number | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          interest_id?: string | null
          name?: string
          organization_id?: string
          temperature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
          created_at: string | null
          evolution_instance: string
          id: string
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          evolution_instance: string
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          evolution_instance?: string
          id?: string
          name?: string
          settings?: Json | null
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
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string | null
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
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
          organization_id: string | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      quote_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          procedure_id: string | null
          procedure_name: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          procedure_id?: string | null
          procedure_name: string
          quantity?: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          procedure_id?: string | null
          procedure_name?: string
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          paid_at: string | null
          payment_method: string | null
          quote_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          paid_at?: string | null
          payment_method?: string | null
          quote_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          payment_method?: string | null
          quote_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_amount: number
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string | null
          patient_id: string | null
          quote_number: string
          status: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_amount?: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_id?: string | null
          quote_number: string
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_amount?: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_id?: string | null
          quote_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
      temperature_transition_rules: {
        Row: {
          action_clear_substatus: boolean | null
          action_set_substatus: string | null
          action_set_temperature: string | null
          active: boolean | null
          created_at: string | null
          from_substatus: string | null
          from_temperature: string | null
          id: string
          name: string
          organization_id: string
          priority: number | null
          timer_minutes: number
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          action_clear_substatus?: boolean | null
          action_set_substatus?: string | null
          action_set_temperature?: string | null
          active?: boolean | null
          created_at?: string | null
          from_substatus?: string | null
          from_temperature?: string | null
          id?: string
          name: string
          organization_id: string
          priority?: number | null
          timer_minutes: number
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          action_clear_substatus?: boolean | null
          action_set_substatus?: string | null
          action_set_temperature?: string | null
          active?: boolean | null
          created_at?: string | null
          from_substatus?: string | null
          from_temperature?: string | null
          id?: string
          name?: string
          organization_id?: string
          priority?: number | null
          timer_minutes?: number
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temperature_transition_rules_organization_id_fkey"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          origin?: string | null
          path?: string | null
          payload?: Json
          processed_at?: string | null
          query_params?: Json | null
          search_vector?: unknown
          status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_webhooks: { Args: never; Returns: undefined }
      generate_quote_number: { Args: never; Returns: string }
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
      has_role_in_org: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      upsert_lead_by_phone:
        | {
            Args: {
              p_direction?: string
              p_interest_id?: string
              p_name?: string
              p_organization_id: string
              p_phone: string
              p_source_id?: string
              p_status?: string
              p_temperature?: string
            }
            Returns: {
              is_new: boolean
              lead_hot_substatus: string
              lead_id: string
              lead_temperature: string
            }[]
          }
        | {
            Args: {
              p_direction?: string
              p_interest_id?: string
              p_name: string
              p_organization_id: string
              p_phone: string
              p_source_id?: string
              p_temperature?: string
            }
            Returns: {
              is_new: boolean
              lead_hot_substatus: string
              lead_id: string
              lead_temperature: string
            }[]
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
