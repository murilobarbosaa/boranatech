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
    PostgrestVersion: "14.5"
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
      admin_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          clicks: number
          code: string
          commission_due_cents: number
          commission_paid_cents: number
          commission_percent: number
          created_at: string | null
          discount_percent: number
          email: string | null
          id: string
          name: string
          notes: string | null
          revenue_cents: number
          sales: number
          status: string
          trials: number
          updated_at: string | null
        }
        Insert: {
          clicks?: number
          code: string
          commission_due_cents?: number
          commission_paid_cents?: number
          commission_percent?: number
          created_at?: string | null
          discount_percent?: number
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          revenue_cents?: number
          sales?: number
          status?: string
          trials?: number
          updated_at?: string | null
        }
        Update: {
          clicks?: number
          code?: string
          commission_due_cents?: number
          commission_paid_cents?: number
          commission_percent?: number
          created_at?: string | null
          discount_percent?: number
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          revenue_cents?: number
          sales?: number
          status?: string
          trials?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_roadmaps: {
        Row: {
          created_at: string
          id: string
          inputs: Json
          roadmap: Json
          slug: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inputs?: Json
          roadmap?: Json
          slug: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json
          roadmap?: Json
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          error_message: string | null
          id: string
          input_chars: number | null
          input_tokens: number | null
          model: string | null
          output_chars: number | null
          output_tokens: number | null
          request_id: string | null
          status: string
          tool: string
          user_id: string | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_chars?: number | null
          input_tokens?: number | null
          model?: string | null
          output_chars?: number | null
          output_tokens?: number | null
          request_id?: string | null
          status: string
          tool: string
          user_id?: string | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_chars?: number | null
          input_tokens?: number | null
          model?: string | null
          output_chars?: number | null
          output_tokens?: number | null
          request_id?: string | null
          status?: string
          tool?: string
          user_id?: string | null
        }
        Relationships: []
      }
      areas: {
        Row: {
          average_salary: Json | null
          color: string | null
          created_at: string | null
          daily_tasks: Json | null
          essential_terms: Json | null
          free_courses: Json | null
          full_description: string | null
          icon: string | null
          id: string
          initial_roadmap: Json | null
          initial_tips: string | null
          is_pro: boolean | null
          is_published: boolean | null
          name: string
          profile_indicated: string | null
          projects: Json | null
          roles: Json | null
          short_description: string | null
          skills: Json | null
          slug: string
          sort_order: number | null
          tag: string | null
          tag_class: string | null
          tools: Json | null
          updated_at: string | null
        }
        Insert: {
          average_salary?: Json | null
          color?: string | null
          created_at?: string | null
          daily_tasks?: Json | null
          essential_terms?: Json | null
          free_courses?: Json | null
          full_description?: string | null
          icon?: string | null
          id?: string
          initial_roadmap?: Json | null
          initial_tips?: string | null
          is_pro?: boolean | null
          is_published?: boolean | null
          name: string
          profile_indicated?: string | null
          projects?: Json | null
          roles?: Json | null
          short_description?: string | null
          skills?: Json | null
          slug: string
          sort_order?: number | null
          tag?: string | null
          tag_class?: string | null
          tools?: Json | null
          updated_at?: string | null
        }
        Update: {
          average_salary?: Json | null
          color?: string | null
          created_at?: string | null
          daily_tasks?: Json | null
          essential_terms?: Json | null
          free_courses?: Json | null
          full_description?: string | null
          icon?: string | null
          id?: string
          initial_roadmap?: Json | null
          initial_tips?: string | null
          is_pro?: boolean | null
          is_published?: boolean | null
          name?: string
          profile_indicated?: string | null
          projects?: Json | null
          roles?: Json | null
          short_description?: string | null
          skills?: Json | null
          slug?: string
          sort_order?: number | null
          tag?: string | null
          tag_class?: string | null
          tools?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      avatar_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_user_id: string
          status: string
          target_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_user_id: string
          status?: string
          target_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_user_id?: string
          status?: string
          target_user_id?: string
        }
        Relationships: []
      }
      beta_access_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          label: string
          revoked_at: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          label: string
          revoked_at?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          label?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      beta_unlock_logs: {
        Row: {
          attempted_code: string | null
          code_id: string | null
          created_at: string
          id: string
          ip: string | null
          label: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_code?: string | null
          code_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          label?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_code?: string | null
          code_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          label?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_unlock_logs_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "beta_access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          event_created_at: string | null
          event_type: string
          id: string
          payment_id: string | null
          provider: string
          provider_subscription_id: string | null
          raw: Json | null
          received_at: string
        }
        Insert: {
          event_created_at?: string | null
          event_type: string
          id: string
          payment_id?: string | null
          provider?: string
          provider_subscription_id?: string | null
          raw?: Json | null
          received_at?: string
        }
        Update: {
          event_created_at?: string | null
          event_type?: string
          id?: string
          payment_id?: string | null
          provider?: string
          provider_subscription_id?: string | null
          raw?: Json | null
          received_at?: string
        }
        Relationships: []
      }
      resend_events: {
        Row: {
          applied: boolean
          bounce_type: string | null
          email: string | null
          event_type: string
          id: string
          message_id: string | null
          payload: Json | null
          received_at: string
        }
        Insert: {
          applied?: boolean
          bounce_type?: string | null
          email?: string | null
          event_type: string
          id: string
          message_id?: string | null
          payload?: Json | null
          received_at?: string
        }
        Update: {
          applied?: boolean
          bounce_type?: string | null
          email?: string | null
          event_type?: string
          id?: string
          message_id?: string | null
          payload?: Json | null
          received_at?: string
        }
        Relationships: []
      }
      career_plans: {
        Row: {
          catalog_version: string
          created_at: string
          id: string
          intake: Json
          result: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          catalog_version: string
          created_at?: string
          id?: string
          intake: Json
          result: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          catalog_version?: string
          created_at?: string
          id?: string
          intake?: Json
          result?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      career_quiz_answers: {
        Row: {
          answer_id: string | null
          answer_text: string | null
          area: string | null
          attempt_id: string
          created_at: string | null
          id: string
          order_index: number | null
          question_id: string
        }
        Insert: {
          answer_id?: string | null
          answer_text?: string | null
          area?: string | null
          attempt_id: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          question_id: string
        }
        Update: {
          answer_id?: string | null
          answer_text?: string | null
          area?: string | null
          attempt_id?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "career_quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      career_quiz_attempts: {
        Row: {
          completed_at: string | null
          confidence: number | null
          created_at: string | null
          id: string
          level: string | null
          result_area: string | null
          result_area_slug: string | null
          result_json: Json | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          level?: string | null
          result_area?: string | null
          result_area_slug?: string | null
          result_json?: Json | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          level?: string | null
          result_area?: string | null
          result_area_slug?: string | null
          result_json?: Json | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          cert_score: number
          code: string
          holder_cpf: string
          holder_name: string
          hours: number
          id: string
          issued_at: string
          quiz_attempt_id: string
          revoked_at: string | null
          revoked_reason: string | null
          roadmap_slug: string
          roadmap_title: string
          score: number
          syllabus: Json
          user_id: string
        }
        Insert: {
          cert_score: number
          code: string
          holder_cpf: string
          holder_name: string
          hours: number
          id?: string
          issued_at?: string
          quiz_attempt_id: string
          revoked_at?: string | null
          revoked_reason?: string | null
          roadmap_slug: string
          roadmap_title: string
          score: number
          syllabus: Json
          user_id: string
        }
        Update: {
          cert_score?: number
          code?: string
          holder_cpf?: string
          holder_name?: string
          hours?: number
          id?: string
          issued_at?: string
          quiz_attempt_id?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          roadmap_slug?: string
          roadmap_title?: string
          score?: number
          syllabus?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "roadmap_quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_list_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invalid_reason: string | null
          list_id: string
          name: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invalid_reason?: string | null
          list_id: string
          name?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invalid_reason?: string | null
          list_id?: string
          name?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duplicate_count: number
          footer_reason: string | null
          id: string
          invalid_count: number
          lgpd_basis: string
          lgpd_note: string | null
          name: string
          original_filename: string | null
          source: string
          suppressed_count: number
          total_rows: number
          valid_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duplicate_count: number
          footer_reason?: string | null
          id?: string
          invalid_count: number
          lgpd_basis: string
          lgpd_note?: string | null
          name: string
          original_filename?: string | null
          source: string
          suppressed_count: number
          total_rows: number
          valid_count: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duplicate_count?: number
          footer_reason?: string | null
          id?: string
          invalid_count?: number
          lgpd_basis?: string
          lgpd_note?: string | null
          name?: string
          original_filename?: string | null
          source?: string
          suppressed_count?: number
          total_rows?: number
          valid_count?: number
        }
        Relationships: []
      }
      content_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          id: string
          resource_id: string | null
          resource_slug: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_slug?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_slug?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      content_sources: {
        Row: {
          base_url: string | null
          code: string
          config: Json | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          name: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          base_url?: string | null
          code: string
          config?: Json | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          base_url?: string | null
          code?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_sync_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          items_created: number | null
          items_failed: number | null
          items_found: number | null
          items_updated: number | null
          raw_summary: Json | null
          source_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_created?: number | null
          items_failed?: number | null
          items_found?: number | null
          items_updated?: number | null
          raw_summary?: Json | null
          source_id?: string | null
          started_at: string
          status: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_created?: number | null
          items_failed?: number | null
          items_found?: number | null
          items_updated?: number | null
          raw_summary?: Json | null
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sync_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          area_slug: string | null
          certificate: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          language: string | null
          level: string | null
          price_label: string | null
          provider: string | null
          rating: number | null
          slug: string | null
          tags: Json | null
          technology_slugs: Json | null
          title: string
          updated_at: string | null
          url: string | null
          workload_hours: number | null
        }
        Insert: {
          area_slug?: string | null
          certificate?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          language?: string | null
          level?: string | null
          price_label?: string | null
          provider?: string | null
          rating?: number | null
          slug?: string | null
          tags?: Json | null
          technology_slugs?: Json | null
          title: string
          updated_at?: string | null
          url?: string | null
          workload_hours?: number | null
        }
        Update: {
          area_slug?: string | null
          certificate?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          language?: string | null
          level?: string | null
          price_label?: string | null
          provider?: string | null
          rating?: number | null
          slug?: string | null
          tags?: Json | null
          technology_slugs?: Json | null
          title?: string
          updated_at?: string | null
          url?: string | null
          workload_hours?: number | null
        }
        Relationships: []
      }
      cron_run_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string
          id: string
          job_name: string
          payload: Json | null
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at: string
          id?: string
          job_name: string
          payload?: Json | null
          started_at: string
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string
          id?: string
          job_name?: string
          payload?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      email_campaign_batch_recipients: {
        Row: {
          batch_id: string
          email: string
        }
        Insert: {
          batch_id: string
          email: string
        }
        Update: {
          batch_id?: string
          email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_batch_recipients_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_batches: {
        Row: {
          batch_limit: number | null
          campaign_id: string
          contact_list_id: string | null
          created_at: string
          created_by: string
          dispatched_at: string | null
          exclude_other_campaigns: boolean
          id: string
          mode: string
          scheduled_for: string | null
          source: string
          status: string
          user_segment: string | null
        }
        Insert: {
          batch_limit?: number | null
          campaign_id: string
          contact_list_id?: string | null
          created_at?: string
          created_by: string
          dispatched_at?: string | null
          exclude_other_campaigns?: boolean
          id?: string
          mode: string
          scheduled_for?: string | null
          source?: string
          status?: string
          user_segment?: string | null
        }
        Update: {
          batch_limit?: number | null
          campaign_id?: string
          contact_list_id?: string | null
          created_at?: string
          created_by?: string
          dispatched_at?: string | null
          exclude_other_campaigns?: boolean
          id?: string
          mode?: string
          scheduled_for?: string | null
          source?: string
          status?: string
          user_segment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_batches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_batches_contact_list_id_fkey"
            columns: ["contact_list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          batch_id: string | null
          campaign_id: string
          delivery_status: string | null
          delivery_updated_at: string | null
          email: string
          error: string | null
          id: string
          position: number
          provider_message_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          batch_id?: string | null
          campaign_id: string
          delivery_status?: string | null
          delivery_updated_at?: string | null
          email: string
          error?: string | null
          id?: string
          position: number
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          batch_id?: string | null
          campaign_id?: string
          delivery_status?: string | null
          delivery_updated_at?: string | null
          email?: string
          error?: string | null
          id?: string
          position?: number
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body: string
          bounced_count: number
          category: string
          complained_count: number
          completed_at: string | null
          created_at: string
          created_by: string
          failed_count: number
          id: string
          image_url: string | null
          sent_count: number
          started_at: string | null
          status: string
          subject: string
          total_recipients: number | null
        }
        Insert: {
          body: string
          bounced_count?: number
          category: string
          complained_count?: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          failed_count?: number
          id?: string
          image_url?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject: string
          total_recipients?: number | null
        }
        Update: {
          body?: string
          bounced_count?: number
          category?: string
          complained_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          failed_count?: number
          id?: string
          image_url?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          total_recipients?: number | null
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason: string
          source: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string
          source?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount_brl_cents: number
          amount_cents: number
          category: string
          created_at: string
          created_by: string
          currency: string
          description: string
          fx_date: string | null
          fx_rate: number | null
          id: string
          incurred_on: string
          kind: string
          notes: string | null
          recurrence_end: string | null
          recurrence_interval: string | null
          recurrence_start: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount_brl_cents: number
          amount_cents: number
          category: string
          created_at?: string
          created_by: string
          currency?: string
          description: string
          fx_date?: string | null
          fx_rate?: number | null
          id?: string
          incurred_on: string
          kind: string
          notes?: string | null
          recurrence_end?: string | null
          recurrence_interval?: string | null
          recurrence_start?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount_brl_cents?: number
          amount_cents?: number
          category?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          fx_date?: string | null
          fx_rate?: number | null
          id?: string
          incurred_on?: string
          kind?: string
          notes?: string | null
          recurrence_end?: string | null
          recurrence_interval?: string | null
          recurrence_start?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      external_jobs: {
        Row: {
          area_slug: string | null
          company: string | null
          contract_type: string | null
          country: string | null
          created_by: string | null
          description: string | null
          employment_type: string | null
          external_id: string | null
          featured: boolean
          featured_until: string | null
          fetched_at: string | null
          id: string
          is_published: boolean | null
          labels: Json | null
          last_seen_at: string | null
          location: string | null
          modality: string | null
          published_at: string | null
          remote: boolean | null
          salary_currency: string | null
          salary_is_predicted: boolean | null
          salary_max: number | null
          salary_min: number | null
          seniority: string | null
          source: string
          tags: Json | null
          title: string
          url: string
        }
        Insert: {
          area_slug?: string | null
          company?: string | null
          contract_type?: string | null
          country?: string | null
          created_by?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          featured?: boolean
          featured_until?: string | null
          fetched_at?: string | null
          id?: string
          is_published?: boolean | null
          labels?: Json | null
          last_seen_at?: string | null
          location?: string | null
          modality?: string | null
          published_at?: string | null
          remote?: boolean | null
          salary_currency?: string | null
          salary_is_predicted?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          source: string
          tags?: Json | null
          title: string
          url: string
        }
        Update: {
          area_slug?: string | null
          company?: string | null
          contract_type?: string | null
          country?: string | null
          created_by?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          featured?: boolean
          featured_until?: string | null
          fetched_at?: string | null
          id?: string
          is_published?: boolean | null
          labels?: Json | null
          last_seen_at?: string | null
          location?: string | null
          modality?: string | null
          published_at?: string | null
          remote?: boolean | null
          salary_currency?: string | null
          salary_is_predicted?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          source?: string
          tags?: Json | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      faculdades_cursos: {
        Row: {
          ano_censo: number
          co_cine_area_detalhada: string | null
          co_cine_rotulo: string | null
          co_curso: number
          co_ies: number
          created_at: string
          no_cine_rotulo: string | null
          no_curso: string
          no_curso_raw: string
          no_grau_academico: string | null
          no_modalidade_ensino: string | null
          no_municipio: string | null
          qt_vg_total: number | null
          sg_uf: string | null
          subarea: string
          tp_grau_academico: number | null
          tp_modalidade_ensino: number | null
        }
        Insert: {
          ano_censo?: number
          co_cine_area_detalhada?: string | null
          co_cine_rotulo?: string | null
          co_curso: number
          co_ies: number
          created_at?: string
          no_cine_rotulo?: string | null
          no_curso: string
          no_curso_raw: string
          no_grau_academico?: string | null
          no_modalidade_ensino?: string | null
          no_municipio?: string | null
          qt_vg_total?: number | null
          sg_uf?: string | null
          subarea: string
          tp_grau_academico?: number | null
          tp_modalidade_ensino?: number | null
        }
        Update: {
          ano_censo?: number
          co_cine_area_detalhada?: string | null
          co_cine_rotulo?: string | null
          co_curso?: number
          co_ies?: number
          created_at?: string
          no_cine_rotulo?: string | null
          no_curso?: string
          no_curso_raw?: string
          no_grau_academico?: string | null
          no_modalidade_ensino?: string | null
          no_municipio?: string | null
          qt_vg_total?: number | null
          sg_uf?: string | null
          subarea?: string
          tp_grau_academico?: number | null
          tp_modalidade_ensino?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faculdades_cursos_co_ies_fkey"
            columns: ["co_ies"]
            isOneToOne: false
            referencedRelation: "faculdades_ies"
            referencedColumns: ["co_ies"]
          },
        ]
      }
      faculdades_ies: {
        Row: {
          ano_censo: number
          co_ies: number
          co_municipio: number | null
          created_at: string
          no_categoria_administrativa: string | null
          no_ies: string
          no_mantenedora: string | null
          no_municipio: string | null
          no_organizacao_academica: string | null
          no_rede: string | null
          sg_ies: string | null
          sg_uf: string
          tp_categoria_administrativa: number | null
          tp_organizacao_academica: number | null
          tp_rede: number | null
        }
        Insert: {
          ano_censo?: number
          co_ies: number
          co_municipio?: number | null
          created_at?: string
          no_categoria_administrativa?: string | null
          no_ies: string
          no_mantenedora?: string | null
          no_municipio?: string | null
          no_organizacao_academica?: string | null
          no_rede?: string | null
          sg_ies?: string | null
          sg_uf: string
          tp_categoria_administrativa?: number | null
          tp_organizacao_academica?: number | null
          tp_rede?: number | null
        }
        Update: {
          ano_censo?: number
          co_ies?: number
          co_municipio?: number | null
          created_at?: string
          no_categoria_administrativa?: string | null
          no_ies?: string
          no_mantenedora?: string | null
          no_municipio?: string | null
          no_organizacao_academica?: string | null
          no_rede?: string | null
          sg_ies?: string | null
          sg_uf?: string
          tp_categoria_administrativa?: number | null
          tp_organizacao_academica?: number | null
          tp_rede?: number | null
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          created_at: string
          currency: string
          fee_cents: number
          gross_cents: number
          id: string
          net_cents: number
          occurred_at: string
          plan_code: string | null
          raw_payload: Json | null
          stripe_balance_transaction_id: string
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency: string
          fee_cents: number
          gross_cents: number
          id?: string
          net_cents: number
          occurred_at: string
          plan_code?: string | null
          raw_payload?: Json | null
          stripe_balance_transaction_id: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          fee_cents?: number
          gross_cents?: number
          id?: string
          net_cents?: number
          occurred_at?: string
          plan_code?: string | null
          raw_payload?: Json | null
          stripe_balance_transaction_id?: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      github_analyses: {
        Row: {
          area: string | null
          created_at: string
          faixa: string | null
          id: string
          input: Json | null
          level: string | null
          result: Json | null
          score: number | null
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          faixa?: string | null
          id?: string
          input?: Json | null
          level?: string | null
          result?: Json | null
          score?: number | null
          user_id: string
        }
        Update: {
          area?: string | null
          created_at?: string
          faixa?: string | null
          id?: string
          input?: Json | null
          level?: string | null
          result?: Json | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      github_improvement_progress: {
        Row: {
          analysis_id: string
          created_at: string | null
          done: boolean
          id: string
          improvement_index: number
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          done?: boolean
          id?: string
          improvement_index: number
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          done?: boolean
          id?: string
          improvement_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_improvement_progress_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "github_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          area: string | null
          created_at: string
          good_count: number
          good_streak: number
          id: string
          job_context: Json | null
          kind: string
          language: string
          level: string | null
          question_count: number
          status: string
          updated_at: string
          user_id: string
          verdict: Json | null
          voice_mode: boolean
        }
        Insert: {
          area?: string | null
          created_at?: string
          good_count?: number
          good_streak?: number
          id?: string
          job_context?: Json | null
          kind: string
          language?: string
          level?: string | null
          question_count?: number
          status?: string
          updated_at?: string
          user_id: string
          verdict?: Json | null
          voice_mode?: boolean
        }
        Update: {
          area?: string | null
          created_at?: string
          good_count?: number
          good_streak?: number
          id?: string
          job_context?: Json | null
          kind?: string
          language?: string
          level?: string | null
          question_count?: number
          status?: string
          updated_at?: string
          user_id?: string
          verdict?: Json | null
          voice_mode?: boolean
        }
        Relationships: []
      }
      interview_turns: {
        Row: {
          content: string
          created_at: string
          evaluation: Json | null
          id: string
          kind: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          evaluation?: Json | null
          id?: string
          kind?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          evaluation?: Json | null
          id?: string
          kind?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_analyses: {
        Row: {
          area: string
          created_at: string
          faixa: string
          id: string
          input: Json
          level: string
          result: Json
          score: number
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          faixa: string
          id?: string
          input: Json
          level: string
          result: Json
          score: number
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          faixa?: string
          id?: string
          input?: Json
          level?: string
          result?: Json
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author: string | null
          created_at: string | null
          enriched_at: string | null
          id: string
          image_url: string | null
          is_external: boolean | null
          is_published: boolean | null
          level: string | null
          published_at: string | null
          slug: string | null
          source: string | null
          summary: string | null
          summary_pt_br: string | null
          tags: Json | null
          title: string
          title_pt_br: string | null
          updated_at: string | null
          url: string
          why_it_matters: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          enriched_at?: string | null
          id?: string
          image_url?: string | null
          is_external?: boolean | null
          is_published?: boolean | null
          level?: string | null
          published_at?: string | null
          slug?: string | null
          source?: string | null
          summary?: string | null
          summary_pt_br?: string | null
          tags?: Json | null
          title: string
          title_pt_br?: string | null
          updated_at?: string | null
          url: string
          why_it_matters?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string | null
          enriched_at?: string | null
          id?: string
          image_url?: string | null
          is_external?: boolean | null
          is_published?: boolean | null
          level?: string | null
          published_at?: string | null
          slug?: string | null
          source?: string | null
          summary?: string | null
          summary_pt_br?: string | null
          tags?: Json | null
          title?: string
          title_pt_br?: string | null
          updated_at?: string | null
          url?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmation_sent_at: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          source: string
          status: string
          unsubscribed_at: string | null
        }
        Insert: {
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string
          status?: string
          unsubscribed_at?: string | null
        }
        Update: {
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string
          status?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          notification_id: string
          user_id: string
        }
        Insert: {
          notification_id: string
          user_id: string
        }
        Update: {
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_super_dismissals: {
        Row: {
          dismissed_at: string
          notification_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          notification_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_super_dismissals_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string
          category: string
          coupon_code: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_super: boolean
          published_at: string | null
          scheduled_for: string | null
          status: string
          super_cta_label: string | null
          super_cta_url: string | null
          super_eyebrow: string | null
          super_subtitle: string | null
          super_title: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          category?: string
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_super?: boolean
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          super_cta_label?: string | null
          super_cta_url?: string | null
          super_eyebrow?: string | null
          super_subtitle?: string | null
          super_title?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          category?: string
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_super?: boolean
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          super_cta_label?: string | null
          super_cta_url?: string | null
          super_eyebrow?: string | null
          super_subtitle?: string | null
          super_title?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          code: string
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          price_cents: number
          provider: string
          provider_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval: string
          is_active?: boolean | null
          name: string
          price_cents: number
          provider: string
          provider_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          provider?: string
          provider_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platforms: {
        Row: {
          best_for: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          limitations: Json | null
          name: string
          price_label: string | null
          rating: number | null
          slug: string | null
          strengths: Json | null
          tags: Json | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          best_for?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          limitations?: Json | null
          name: string
          price_label?: string | null
          rating?: number | null
          slug?: string | null
          strengths?: Json | null
          tags?: Json | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          best_for?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          limitations?: Json | null
          name?: string
          price_label?: string | null
          rating?: number | null
          slug?: string | null
          strengths?: Json | null
          tags?: Json | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area_interesse: string | null
          avatar_bg: string
          avatar_border: string
          avatar_icon: string
          avatar_mode: string
          avatar_moderation_reviewed_by: string | null
          avatar_moderation_status: string
          avatar_moderation_updated_at: string | null
          avatar_storage_path: string | null
          avatar_upload_disabled: boolean
          avatar_url: string | null
          bio: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          handle: string | null
          id: string
          marketing_opt_in: boolean
          marketing_opt_in_at: string | null
          name: string | null
          nivel_atual: string | null
          objetivo: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
          welcome_email_sent: boolean
        }
        Insert: {
          area_interesse?: string | null
          avatar_bg?: string
          avatar_border?: string
          avatar_icon?: string
          avatar_mode?: string
          avatar_moderation_reviewed_by?: string | null
          avatar_moderation_status?: string
          avatar_moderation_updated_at?: string | null
          avatar_storage_path?: string | null
          avatar_upload_disabled?: boolean
          avatar_url?: string | null
          bio?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          handle?: string | null
          id?: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          name?: string | null
          nivel_atual?: string | null
          objetivo?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
          welcome_email_sent?: boolean
        }
        Update: {
          area_interesse?: string | null
          avatar_bg?: string
          avatar_border?: string
          avatar_icon?: string
          avatar_mode?: string
          avatar_moderation_reviewed_by?: string | null
          avatar_moderation_status?: string
          avatar_moderation_updated_at?: string | null
          avatar_storage_path?: string | null
          avatar_upload_disabled?: boolean
          avatar_url?: string | null
          bio?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          handle?: string | null
          id?: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          name?: string | null
          nivel_atual?: string | null
          objetivo?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
          welcome_email_sent?: boolean
        }
        Relationships: []
      }
      project_validations: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          project_id: string
          requisitos_result: Json
          status: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          project_id: string
          requisitos_result: Json
          status: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          project_id?: string
          requisitos_result?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_validations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "github_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          area_slug: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          level: string | null
          linkedin_suggestion: string | null
          objective: string | null
          portfolio_tips: string | null
          simplified_steps: Json | null
          slug: string | null
          tags: Json | null
          title: string
          tools: Json | null
          updated_at: string | null
        }
        Insert: {
          area_slug?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          level?: string | null
          linkedin_suggestion?: string | null
          objective?: string | null
          portfolio_tips?: string | null
          simplified_steps?: Json | null
          slug?: string | null
          tags?: Json | null
          title: string
          tools?: Json | null
          updated_at?: string | null
        }
        Update: {
          area_slug?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          level?: string | null
          linkedin_suggestion?: string | null
          objective?: string | null
          portfolio_tips?: string | null
          simplified_steps?: Json | null
          slug?: string | null
          tags?: Json | null
          title?: string
          tools?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          created_at: string
          faixa: string
          id: string
          input: Json
          result: Json
          score: number
          target_role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          faixa: string
          id?: string
          input: Json
          result: Json
          score: number
          target_role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          faixa?: string
          id?: string
          input?: Json
          result?: Json
          score?: number
          target_role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          curriculo: Json
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          curriculo: Json
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          curriculo?: Json
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_completions: {
        Row: {
          completed_at: string
          id: string
          required_count: number
          roadmap_slug: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          required_count: number
          roadmap_slug: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          required_count?: number
          roadmap_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          id: string
          questions: Json
          roadmap_slug: string
          score: number | null
          status: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          questions: Json
          roadmap_slug: string
          score?: number | null
          status: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          questions?: Json
          roadmap_slug?: string
          score?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          created_at: string | null
          deliverable: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          is_pro: boolean | null
          order_index: number
          resources: Json | null
          roadmap_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deliverable?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_pro?: boolean | null
          order_index: number
          resources?: Json | null
          roadmap_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deliverable?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_pro?: boolean | null
          order_index?: number
          resources?: Json | null
          roadmap_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          area_slug: string | null
          created_at: string | null
          description: string | null
          estimated_duration_weeks: number | null
          id: string
          is_pro: boolean | null
          is_published: boolean | null
          level: string | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          area_slug?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          is_pro?: boolean | null
          is_published?: boolean | null
          level?: string | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          area_slug?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          is_pro?: boolean | null
          is_published?: boolean | null
          level?: string | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      search_documents: {
        Row: {
          description: string | null
          id: string
          is_published: boolean | null
          resource_id: string
          resource_type: string
          search_vector: unknown
          tags: Json | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_published?: boolean | null
          resource_id: string
          resource_type: string
          search_vector?: unknown
          tags?: Json | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_published?: boolean | null
          resource_id?: string
          resource_type?: string
          search_vector?: unknown
          tags?: Json | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      study_entries: {
        Row: {
          created_at: string | null
          id: string
          minutes: number
          mode: string
          studied_at: string
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          minutes?: number
          mode?: string
          studied_at?: string
          text?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          minutes?: number
          mode?: string
          studied_at?: string
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_cancellations: {
        Row: {
          canceled_at: string
          effective_at: string | null
          id: string
          provider_subscription_id: string | null
          reason_code: string | null
          reason_text: string | null
          status: string
          user_id: string
        }
        Insert: {
          canceled_at?: string
          effective_at?: string | null
          id?: string
          provider_subscription_id?: string | null
          reason_code?: string | null
          reason_text?: string | null
          status?: string
          user_id: string
        }
        Update: {
          canceled_at?: string
          effective_at?: string | null
          id?: string
          provider_subscription_id?: string | null
          reason_code?: string | null
          reason_text?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          affiliate_code: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_event_at: string | null
          payment_method: string | null
          plan_id: string | null
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          raw_provider_payload: Json | null
          renewal_reminder_sent_at: string | null
          renewal_reminders_sent: string[]
          renewal_type: string
          status: string
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affiliate_code?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_event_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          raw_provider_payload?: Json | null
          renewal_reminder_sent_at?: string | null
          renewal_reminders_sent?: string[]
          renewal_type?: string
          status?: string
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affiliate_code?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_event_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          raw_provider_payload?: Json | null
          renewal_reminder_sent_at?: string | null
          renewal_reminders_sent?: string[]
          renewal_type?: string
          status?: string
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      technologies: {
        Row: {
          beginner_friendly_score: number | null
          category: string | null
          color: string | null
          companies_using: Json | null
          cons: Json | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          learning_path: Json | null
          long_description: string | null
          market_demand: string | null
          name: string
          pros: Json | null
          related_area_slugs: Json | null
          resources: Json | null
          salary_context: Json | null
          slug: string
          sort_order: number | null
          tools: Json | null
          updated_at: string | null
          use_cases: Json | null
        }
        Insert: {
          beginner_friendly_score?: number | null
          category?: string | null
          color?: string | null
          companies_using?: Json | null
          cons?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          learning_path?: Json | null
          long_description?: string | null
          market_demand?: string | null
          name: string
          pros?: Json | null
          related_area_slugs?: Json | null
          resources?: Json | null
          salary_context?: Json | null
          slug: string
          sort_order?: number | null
          tools?: Json | null
          updated_at?: string | null
          use_cases?: Json | null
        }
        Update: {
          beginner_friendly_score?: number | null
          category?: string | null
          color?: string | null
          companies_using?: Json | null
          cons?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          learning_path?: Json | null
          long_description?: string | null
          market_demand?: string | null
          name?: string
          pros?: Json | null
          related_area_slugs?: Json | null
          resources?: Json | null
          salary_context?: Json | null
          slug?: string
          sort_order?: number | null
          tools?: Json | null
          updated_at?: string | null
          use_cases?: Json | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string
          resource_type: string
          subtitle_snapshot: string | null
          title_snapshot: string | null
          url_snapshot: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_id: string
          resource_type: string
          subtitle_snapshot?: string | null
          title_snapshot?: string | null
          url_snapshot?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string
          resource_type?: string
          subtitle_snapshot?: string | null
          title_snapshot?: string | null
          url_snapshot?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted_at: string
          document: string
          id: string
          ip: unknown
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document: string
          id?: string
          ip?: unknown
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document?: string
          id?: string
          ip?: unknown
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          context: string
          created_at: string
          id: string
          item_key: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          context: string
          created_at?: string
          id?: string
          item_key: string
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          item_key?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roadmap_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          roadmap_id: string
          status: string
          step_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          roadmap_id: string
          status?: string
          step_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          roadmap_id?: string
          status?: string
          step_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roadmap_progress_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roadmap_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "roadmap_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          source: string
          status: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          source?: string
          status?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          source?: string
          status?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      resend_apply_event: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      buscar_faculdades_cursos: {
        Args: {
          p_grau?: number
          p_limit?: number
          p_modalidade?: number
          p_offset?: number
          p_rede?: number
          p_subarea?: string
          p_termo: string
          p_uf?: string
        }
        Returns: {
          co_cine_area_detalhada: string
          co_curso: number
          co_ies: number
          ies_no_ies: string
          ies_no_organizacao_academica: string
          ies_no_rede: string
          ies_sg_ies: string
          ies_tp_organizacao_academica: number
          no_cine_rotulo: string
          no_curso: string
          no_curso_raw: string
          no_grau_academico: string
          no_modalidade_ensino: string
          no_municipio: string
          qt_vg_total: number
          sg_uf: string
          subarea: string
          total_count: number
          tp_grau_academico: number
          tp_modalidade_ensino: number
        }[]
      }
      call_cron_endpoint: { Args: { endpoint_path: string }; Returns: number }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      email_campaign_add_recipients: {
        Args: { p_batch_id: string; p_campaign_id: string; p_emails: string[] }
        Returns: {
          recipient_email: string
          recipient_id: string
        }[]
      }
      email_campaign_cleanup_canceled_batch: {
        Args: { p_batch_id: string }
        Returns: undefined
      }
      email_campaign_record_result: {
        Args: {
          p_error?: string
          p_provider_message_id?: string
          p_recipient_id: string
          p_success: boolean
        }
        Returns: undefined
      }
      email_campaign_try_complete: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      get_ai_usage_admin_summary: {
        Args: { p_since?: string; p_until?: string }
        Returns: {
          error_runs: number
          success_runs: number
          tool: string
          total_cost_estimate: number
          total_input_tokens: number
          total_output_tokens: number
          total_runs: number
        }[]
      }
      get_ai_usage_today: { Args: { p_user_id: string }; Returns: number }
      get_ai_usage_today_by_tool: {
        Args: { p_tool: string; p_user_id: string }
        Returns: number
      }
      get_study_heatmap: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          date: string
          entries: number
          minutes: number
        }[]
      }
      get_study_stats: {
        Args: { p_range?: string; p_user_id: string }
        Returns: Json
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      increment_affiliate_clicks: {
        Args: { p_code: string }
        Returns: undefined
      }
      increment_affiliate_conversion: {
        Args: { p_affiliate_id: string; p_revenue_cents: number }
        Returns: undefined
      }
      increment_affiliate_trials: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      is_user_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_user_pro: { Args: { p_user_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
