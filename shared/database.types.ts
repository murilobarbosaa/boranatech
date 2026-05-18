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
          result_area?: string | null
          result_area_slug?: string | null
          result_json?: Json | null
          started_at?: string | null
          user_id?: string | null
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
      external_jobs: {
        Row: {
          area_slug: string | null
          company: string | null
          description: string | null
          employment_type: string | null
          external_id: string | null
          fetched_at: string | null
          id: string
          is_published: boolean | null
          location: string | null
          published_at: string | null
          remote: boolean | null
          seniority: string | null
          source: string
          tags: Json | null
          title: string
          url: string
        }
        Insert: {
          area_slug?: string | null
          company?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          fetched_at?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          published_at?: string | null
          remote?: boolean | null
          seniority?: string | null
          source: string
          tags?: Json | null
          title: string
          url: string
        }
        Update: {
          area_slug?: string | null
          company?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          fetched_at?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          published_at?: string | null
          remote?: boolean | null
          seniority?: string | null
          source?: string
          tags?: Json | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_external: boolean | null
          is_published: boolean | null
          published_at: string | null
          slug: string | null
          source: string | null
          summary: string | null
          tags: Json | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_external?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string | null
          source?: string | null
          summary?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          author?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_external?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string | null
          source?: string | null
          summary?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
          url?: string
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
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          handle: string | null
          id: string
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
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string | null
          id?: string
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
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string | null
          id?: string
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
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          raw_provider_payload: Json | null
          status: string
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          raw_provider_payload?: Json | null
          status?: string
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          raw_provider_payload?: Json | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_cron_endpoint: { Args: { endpoint_path: string }; Returns: number }
      get_ai_usage_today: { Args: { p_user_id: string }; Returns: number }
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
      is_user_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_user_pro: { Args: { p_user_id: string }; Returns: boolean }
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
