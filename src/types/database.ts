export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      action_plans: {
        Row: {
          completion_date: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          responsible: string | null
          risk_item_id: string
          status: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          responsible?: string | null
          risk_item_id: string
          status?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          responsible?: string | null
          risk_item_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_risk_item_id_fkey"
            columns: ["risk_item_id"]
            isOneToOne: false
            referencedRelation: "risk_items"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      control_measures: {
        Row: {
          created_at: string | null
          description: string
          effectiveness: string | null
          id: string
          measure_type: string | null
          risk_item_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          effectiveness?: string | null
          id?: string
          measure_type?: string | null
          risk_item_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          effectiveness?: string | null
          id?: string
          measure_type?: string | null
          risk_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_measures_risk_item_id_fkey"
            columns: ["risk_item_id"]
            isOneToOne: false
            referencedRelation: "risk_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_action_events: {
        Row: {
          action_id: string
          activity_id: string
          assessment_id: string
          created_at: string
          created_by: string | null
          description: string | null
          evaluation_id: string | null
          event_date: string
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          action_id: string
          activity_id: string
          assessment_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          evaluation_id?: string | null
          event_date?: string
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          action_id?: string
          activity_id?: string
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          evaluation_id?: string | null
          event_date?: string
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_action_events_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "gap_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_action_events_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "gap_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_action_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_action_events_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "gap_activity_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_actions: {
        Row: {
          activity_id: string
          actual_end_date: string | null
          actual_start_date: string | null
          assessment_id: string
          created_at: string
          depends_on_action_id: string | null
          description: string
          evaluation_id: string
          id: string
          milestone: boolean
          notes: string | null
          phase: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          priority: string
          progress: number
          responsible: string | null
          status: string
          updated_at: string
          user_id: string
          verification_due_date: string | null
          verification_method: string | null
          verification_notes: string | null
          verification_result: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          activity_id: string
          actual_end_date?: string | null
          actual_start_date?: string | null
          assessment_id: string
          created_at?: string
          depends_on_action_id?: string | null
          description: string
          evaluation_id: string
          id?: string
          milestone?: boolean
          notes?: string | null
          phase?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string
          progress?: number
          responsible?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_due_date?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_result?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          activity_id?: string
          actual_end_date?: string | null
          actual_start_date?: string | null
          assessment_id?: string
          created_at?: string
          depends_on_action_id?: string | null
          description?: string
          evaluation_id?: string
          id?: string
          milestone?: boolean
          notes?: string | null
          phase?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string
          progress?: number
          responsible?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_due_date?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_result?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_actions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "gap_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_actions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_actions_depends_on_action_id_fkey"
            columns: ["depends_on_action_id"]
            isOneToOne: false
            referencedRelation: "gap_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_actions_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "gap_activity_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_activities: {
        Row: {
          area_id: string
          code: string
          created_at: string
          created_in_assessment_id: string | null
          description: string | null
          id: string
          name: string
          operator: string | null
          order_index: number
          source_type: string
          target_state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id: string
          code: string
          created_at?: string
          created_in_assessment_id?: string | null
          description?: string | null
          id?: string
          name: string
          operator?: string | null
          order_index?: number
          source_type?: string
          target_state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string
          code?: string
          created_at?: string
          created_in_assessment_id?: string | null
          description?: string | null
          id?: string
          name?: string
          operator?: string | null
          order_index?: number
          source_type?: string
          target_state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_activities_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "gap_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_activities_created_in_assessment_id_fkey"
            columns: ["created_in_assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_activity_evaluations: {
        Row: {
          activity_code_snapshot: string | null
          activity_id: string
          activity_name_snapshot: string | null
          area_name_snapshot: string | null
          assessment_id: string
          compliance_status: string
          created_at: string
          current_state: string | null
          evaluated_at: string | null
          evaluated_by: string | null
          gap_description: string | null
          id: string
          notes: string | null
          process_name_snapshot: string | null
          risk_priority: string
          target_state_override: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_code_snapshot?: string | null
          activity_id: string
          activity_name_snapshot?: string | null
          area_name_snapshot?: string | null
          assessment_id: string
          compliance_status?: string
          created_at?: string
          current_state?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          gap_description?: string | null
          id?: string
          notes?: string | null
          process_name_snapshot?: string | null
          risk_priority?: string
          target_state_override?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_code_snapshot?: string | null
          activity_id?: string
          activity_name_snapshot?: string | null
          area_name_snapshot?: string | null
          assessment_id?: string
          compliance_status?: string
          created_at?: string
          current_state?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          gap_description?: string | null
          id?: string
          notes?: string | null
          process_name_snapshot?: string | null
          risk_priority?: string
          target_state_override?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_activity_evaluations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "gap_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_activity_evaluations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_activity_standards: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          specific_reference: string | null
          standard_id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          specific_reference?: string | null
          standard_id: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          specific_reference?: string | null
          standard_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_activity_standards_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "gap_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_activity_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "gap_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_areas: {
        Row: {
          code: string
          created_at: string
          created_in_assessment_id: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          process_id: string
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          created_in_assessment_id?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number
          process_id: string
          source_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          created_in_assessment_id?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          process_id?: string
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_areas_created_in_assessment_id_fkey"
            columns: ["created_in_assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_areas_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "gap_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_assessment_processes: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          process_id: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          process_id: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          process_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_assessment_processes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_assessment_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "gap_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_assessments: {
        Row: {
          assessment_date: string | null
          assessor: string | null
          compliance_percentage: number
          compliant_count: number
          created_at: string
          department: string | null
          description: string | null
          facility_name: string | null
          id: string
          na_count: number
          non_compliant_count: number
          not_evaluated_count: number
          partial_count: number
          status: string
          title: string
          total_activities: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_date?: string | null
          assessor?: string | null
          compliance_percentage?: number
          compliant_count?: number
          created_at?: string
          department?: string | null
          description?: string | null
          facility_name?: string | null
          id?: string
          na_count?: number
          non_compliant_count?: number
          not_evaluated_count?: number
          partial_count?: number
          status?: string
          title: string
          total_activities?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_date?: string | null
          assessor?: string | null
          compliance_percentage?: number
          compliant_count?: number
          created_at?: string
          department?: string | null
          description?: string | null
          facility_name?: string | null
          id?: string
          na_count?: number
          non_compliant_count?: number
          not_evaluated_count?: number
          partial_count?: number
          status?: string
          title?: string
          total_activities?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gap_links: {
        Row: {
          activity_id: string | null
          assessment_id: string | null
          created_at: string
          evaluation_id: string | null
          id: string
          linked_id: string
          linked_type: string
          notes: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          assessment_id?: string | null
          created_at?: string
          evaluation_id?: string | null
          id?: string
          linked_id: string
          linked_type: string
          notes?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          assessment_id?: string | null
          created_at?: string
          evaluation_id?: string | null
          id?: string
          linked_id?: string
          linked_type?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_links_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "gap_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_links_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_links_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "gap_activity_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_processes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_template: boolean
          name: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name: string
          order_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gap_standards: {
        Row: {
          application_scope: string | null
          code: string
          created_at: string
          created_in_assessment_id: string | null
          description: string | null
          id: string
          is_mandatory: boolean
          is_template: boolean
          issuing_body: string | null
          name: string
          source_type: string
          updated_at: string
          url: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          application_scope?: string | null
          code: string
          created_at?: string
          created_in_assessment_id?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean
          is_template?: boolean
          issuing_body?: string | null
          name: string
          source_type?: string
          updated_at?: string
          url?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          application_scope?: string | null
          code?: string
          created_at?: string
          created_in_assessment_id?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean
          is_template?: boolean
          issuing_body?: string | null
          name?: string
          source_type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_standards_created_in_assessment_id_fkey"
            columns: ["created_in_assessment_id"]
            isOneToOne: false
            referencedRelation: "gap_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      process_steps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          process_id: string
          step_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          process_id: string
          step_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          process_id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "process_steps_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          area_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      rca_action_plans: {
        Row: {
          assessment_id: string
          cause_id: string | null
          completion_date: string | null
          created_at: string
          description: string
          due_date: string | null
          effectiveness_check: string | null
          id: string
          notes: string | null
          priority: string | null
          responsible: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          cause_id?: string | null
          completion_date?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          effectiveness_check?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          cause_id?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          effectiveness_check?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rca_action_plans_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rca_action_plans_cause_fk"
            columns: ["cause_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_causes"
            referencedColumns: ["id", "assessment_id"]
          },
        ]
      }
      rca_assessments: {
        Row: {
          closed_at: string | null
          conclusion: string | null
          created_at: string
          department: string | null
          description: string | null
          event_date: string | null
          event_description: string | null
          event_time: string | null
          event_title: string
          event_type: string | null
          id: string
          immediate_containment: string | null
          location: string | null
          methodology: string | null
          reported_at: string | null
          severity: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          conclusion?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          event_date?: string | null
          event_description?: string | null
          event_time?: string | null
          event_title: string
          event_type?: string | null
          id?: string
          immediate_containment?: string | null
          location?: string | null
          methodology?: string | null
          reported_at?: string | null
          severity?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          conclusion?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          event_date?: string | null
          event_description?: string | null
          event_time?: string | null
          event_title?: string
          event_type?: string | null
          id?: string
          immediate_containment?: string | null
          location?: string | null
          methodology?: string | null
          reported_at?: string | null
          severity?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rca_causes: {
        Row: {
          assessment_id: string
          category: string | null
          confidence_level: string | null
          created_at: string
          description: string
          evidence: string | null
          id: string
          is_root_cause: boolean
          notes: string | null
          root_cause_confirmation_notes: string | null
          root_cause_confirmed_at: string | null
          root_cause_status: string | null
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          category?: string | null
          confidence_level?: string | null
          created_at?: string
          description: string
          evidence?: string | null
          id?: string
          is_root_cause?: boolean
          notes?: string | null
          root_cause_confirmation_notes?: string | null
          root_cause_confirmed_at?: string | null
          root_cause_status?: string | null
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          category?: string | null
          confidence_level?: string | null
          created_at?: string
          description?: string
          evidence?: string | null
          id?: string
          is_root_cause?: boolean
          notes?: string | null
          root_cause_confirmation_notes?: string | null
          root_cause_confirmed_at?: string | null
          root_cause_status?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rca_causes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      rca_fishbone_branches: {
        Row: {
          assessment_id: string
          created_at: string
          diagram_id: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          source_type: string
          standard_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          diagram_id: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          source_type?: string
          standard_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          diagram_id?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          source_type?: string
          standard_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rca_fishbone_branches_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rca_fishbone_branches_diagram_fk"
            columns: ["diagram_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_fishbone_diagrams"
            referencedColumns: ["id", "assessment_id"]
          },
        ]
      }
      rca_fishbone_causes: {
        Row: {
          assessment_id: string
          branch_id: string
          cause_id: string
          created_at: string
          id: string
          parent_id: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          assessment_id: string
          branch_id: string
          cause_id: string
          created_at?: string
          id?: string
          parent_id?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          assessment_id?: string
          branch_id?: string
          cause_id?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rca_fishbone_causes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rca_fishbone_causes_branch_fk"
            columns: ["branch_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_fishbone_branches"
            referencedColumns: ["id", "assessment_id"]
          },
          {
            foreignKeyName: "rca_fishbone_causes_cause_fk"
            columns: ["cause_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_causes"
            referencedColumns: ["id", "assessment_id"]
          },
          {
            foreignKeyName: "rca_fishbone_causes_parent_fk"
            columns: ["parent_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_fishbone_causes"
            referencedColumns: ["id", "assessment_id"]
          },
        ]
      }
      rca_fishbone_diagrams: {
        Row: {
          assessment_id: string
          created_at: string
          effect_statement: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          effect_statement: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          effect_statement?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rca_fishbone_diagrams_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "rca_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      rca_five_why_chains: {
        Row: {
          assessment_id: string
          cause_id: string | null
          created_at: string
          id: string
          problem_statement: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          cause_id?: string | null
          created_at?: string
          id?: string
          problem_statement: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          cause_id?: string | null
          created_at?: string
          id?: string
          problem_statement?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rca_five_why_chains_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rca_five_why_chains_cause_fk"
            columns: ["cause_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_causes"
            referencedColumns: ["id", "assessment_id"]
          },
        ]
      }
      rca_five_why_steps: {
        Row: {
          answer: string
          assessment_id: string
          cause_id: string | null
          chain_id: string
          created_at: string
          id: string
          is_root_step: boolean
          step_number: number
          user_id: string
          why_question: string
        }
        Insert: {
          answer: string
          assessment_id: string
          cause_id?: string | null
          chain_id: string
          created_at?: string
          id?: string
          is_root_step?: boolean
          step_number: number
          user_id: string
          why_question: string
        }
        Update: {
          answer?: string
          assessment_id?: string
          cause_id?: string | null
          chain_id?: string
          created_at?: string
          id?: string
          is_root_step?: boolean
          step_number?: number
          user_id?: string
          why_question?: string
        }
        Relationships: [
          {
            foreignKeyName: "rca_five_why_steps_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rca_five_why_steps_cause_fk"
            columns: ["cause_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_causes"
            referencedColumns: ["id", "assessment_id"]
          },
          {
            foreignKeyName: "rca_five_why_steps_chain_fk"
            columns: ["chain_id", "assessment_id"]
            isOneToOne: false
            referencedRelation: "rca_five_why_chains"
            referencedColumns: ["id", "assessment_id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          area_id: string | null
          created_at: string | null
          description: string | null
          id: string
          process_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          process_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          process_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_catalog_base: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      risk_catalog_user: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_items: {
        Row: {
          assessment_id: string
          created_at: string | null
          custom_risk_description: string | null
          custom_risk_name: string | null
          detectability: number | null
          hazard_score: number | null
          id: string
          notes: string | null
          probability: number | null
          process_step_id: string | null
          risk_catalog_base_id: string | null
          risk_catalog_user_id: string | null
          risk_class: string | null
          rpn: number | null
          severity: number | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          custom_risk_description?: string | null
          custom_risk_name?: string | null
          detectability?: number | null
          hazard_score?: number | null
          id?: string
          notes?: string | null
          probability?: number | null
          process_step_id?: string | null
          risk_catalog_base_id?: string | null
          risk_catalog_user_id?: string | null
          risk_class?: string | null
          rpn?: number | null
          severity?: number | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          custom_risk_description?: string | null
          custom_risk_name?: string | null
          detectability?: number | null
          hazard_score?: number | null
          id?: string
          notes?: string | null
          probability?: number | null
          process_step_id?: string | null
          risk_catalog_base_id?: string | null
          risk_catalog_user_id?: string | null
          risk_class?: string | null
          rpn?: number | null
          severity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "risk_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_items_process_step_id_fkey"
            columns: ["process_step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_items_risk_catalog_base_id_fkey"
            columns: ["risk_catalog_base_id"]
            isOneToOne: false
            referencedRelation: "risk_catalog_base"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_items_risk_catalog_user_id_fkey"
            columns: ["risk_catalog_user_id"]
            isOneToOne: false
            referencedRelation: "risk_catalog_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_risks: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          color_palette: string | null
          created_at: string | null
          facility_name: string | null
          id: string
          organization_name: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_palette?: string | null
          created_at?: string | null
          facility_name?: string | null
          id?: string
          organization_name?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_palette?: string | null
          created_at?: string | null
          facility_name?: string | null
          id?: string
          organization_name?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

