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
      account_educations: {
        Row: {
          account_id: string
          content: string
          created_at: string
          end_date: string | null
          id: number
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string
          content: string
          created_at?: string
          end_date?: string | null
          id?: number
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string
          end_date?: string | null
          id?: number
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_educations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      account_license: {
        Row: {
          account_id: string
          acquisition_date: string
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          acquisition_date: string
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          acquisition_date?: string
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_license_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      account_work_experiences: {
        Row: {
          account_id: string
          company_name: string | null
          content: Json | null
          created_at: string
          end_date: string | null
          id: number
          position: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string
          company_name?: string | null
          content?: Json | null
          created_at?: string
          end_date?: string | null
          id?: number
          position?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          company_name?: string | null
          content?: Json | null
          created_at?: string
          end_date?: string | null
          id?: number
          position?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_work_experiences_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      accounts: {
        Row: {
          bio: string
          created_at: string
          deleted_at: string | null
          expertise: string[] | null
          main_job: string[] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string
          availability_status: 'available' | 'busy'
        }
        Insert: {
          bio: string
          created_at?: string
          deleted_at?: string | null
          expertise?: string[] | null
          main_job?: string[] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string
          availability_status?: 'available' | 'busy'
        }
        Update: {
          bio?: string
          created_at?: string
          deleted_at?: string | null
          expertise?: string[] | null
          main_job?: string[] | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string
          availability_status?: 'available' | 'busy'
        }
        Relationships: []
      }
      chat: {
        Row: {
          chat_created_at: string | null
          chat_id: number
          estimate_id: number | null
        }
        Insert: {
          chat_created_at?: string | null
          chat_id?: number
          estimate_id?: number | null
        }
        Update: {
          chat_created_at?: string | null
          chat_id?: number
          estimate_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate"
            referencedColumns: ["estimate_id"]
          },
        ]
      }
      chat_message: {
        Row: {
          attachment: string | null
          chat_id: number
          chat_message_id: number
          estimate_id: number
          message: string | null
          message_sent_at: string | null
          message_type: Database["public"]["Enums"]["message_type"]
          sender_id: number | null
          sender_type: string | null
        }
        Insert: {
          attachment?: string | null
          chat_id: number
          chat_message_id?: number
          estimate_id: number
          message?: string | null
          message_sent_at?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id?: number | null
          sender_type?: string | null
        }
        Update: {
          attachment?: string | null
          chat_id?: number
          chat_message_id?: number
          estimate_id?: number
          message?: string | null
          message_sent_at?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id?: number | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_message_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate"
            referencedColumns: ["estimate_id"]
          },
        ]
      }
      client: {
        Row: {
          client_status: string | null
          company_name: string | null
          contact_info: string | null
          created_at: string | null
          email: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_status?: string | null
          company_name?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          client_status?: string | null
          company_name?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      counsel: {
        Row: {
          client_id: string
          cost: string
          counsel_date: string | null
          counsel_id: number
          counsel_status: string
          counsel_type: string | null
          due_date: string
          feild: string | null
          outline: string | null
          output: string | null
          period: string
          skill: string[] | null
          start_date: string
          title: string | null
        }
        Insert: {
          client_id?: string
          cost?: string
          counsel_date?: string | null
          counsel_id?: number
          counsel_status?: string
          counsel_type?: string | null
          due_date?: string
          feild?: string | null
          outline?: string | null
          output?: string | null
          period?: string
          skill?: string[] | null
          start_date?: string
          title?: string | null
        }
        Update: {
          client_id?: string
          cost?: string
          counsel_date?: string | null
          counsel_id?: number
          counsel_status?: string
          counsel_type?: string | null
          due_date?: string
          feild?: string | null
          outline?: string | null
          output?: string | null
          period?: string
          skill?: string[] | null
          start_date?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counsel_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["user_id"]
          },
        ]
      }
      estimate: {
        Row: {
          client_id: string
          counsel_id: number | null
          estimate_date: string | null
          estimate_due_date: string | null
          estimate_id: number
          estimate_start_date: string | null
          estimate_status: Database["public"]["Enums"]["estimate_status"]
          manager_id: string | null
          team_id: number
        }
        Insert: {
          client_id?: string
          counsel_id?: number | null
          estimate_date?: string | null
          estimate_due_date?: string | null
          estimate_id?: number
          estimate_start_date?: string | null
          estimate_status?: Database["public"]["Enums"]["estimate_status"]
          manager_id?: string | null
          team_id: number
        }
        Update: {
          client_id?: string
          counsel_id?: number | null
          estimate_date?: string | null
          estimate_due_date?: string | null
          estimate_id?: number
          estimate_start_date?: string | null
          estimate_status?: Database["public"]["Enums"]["estimate_status"]
          manager_id?: string | null
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "estimate_counsel_id_fkey"
            columns: ["counsel_id"]
            isOneToOne: false
            referencedRelation: "counsel"
            referencedColumns: ["counsel_id"]
          },
          {
            foreignKeyName: "estimate_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "estimate_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_version: {
        Row: {
          detail: string | null
          end_date: string | null
          estimate_id: number | null
          estimate_version_id: number
          start_date: string | null
          total_amount: number | null
          version_date: string | null
        }
        Insert: {
          detail?: string | null
          end_date?: string | null
          estimate_id?: number | null
          estimate_version_id?: number
          start_date?: string | null
          total_amount?: number | null
          version_date?: string | null
        }
        Update: {
          detail?: string | null
          end_date?: string | null
          estimate_id?: number | null
          estimate_version_id?: number
          start_date?: string | null
          total_amount?: number | null
          version_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_version_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate"
            referencedColumns: ["estimate_id"]
          },
        ]
      }
      magazine: {
        Row: {
          body: string | null
          created_at: string
          id: number
          image: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: number
          image?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: number
          image?: string | null
          title?: string | null
        }
        Relationships: []
      }
      manager_bookmarks: {
        Row: {
          created_at: string
          id: number
          maker_id: string
          manager_id: string
          proposal_status: boolean
        }
        Insert: {
          created_at?: string
          id?: number
          maker_id: string
          manager_id?: string
          proposal_status: boolean
        }
        Update: {
          created_at?: string
          id?: number
          maker_id?: string
          manager_id?: string
          proposal_status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "manager_bookmarks_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_bookmarks_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      milestone: {
        Row: {
          detail: string | null
          estimate_id: number | null
          estimate_version_id: number | null
          milestone_due_date: string | null
          milestone_id: number
          milestone_start_date: string | null
          milestone_status:
            | Database["public"]["Enums"]["milestone_status"]
            | null
          output: string | null
          payment_amount: number | null
          progress: number
          title: string | null
        }
        Insert: {
          detail?: string | null
          estimate_id?: number | null
          estimate_version_id?: number | null
          milestone_due_date?: string | null
          milestone_id?: number
          milestone_start_date?: string | null
          milestone_status?:
            | Database["public"]["Enums"]["milestone_status"]
            | null
          output?: string | null
          payment_amount?: number | null
          progress?: number
          title?: string | null
        }
        Update: {
          detail?: string | null
          estimate_id?: number | null
          estimate_version_id?: number | null
          milestone_due_date?: string | null
          milestone_id?: number
          milestone_start_date?: string | null
          milestone_status?:
            | Database["public"]["Enums"]["milestone_status"]
            | null
          output?: string | null
          payment_amount?: number | null
          progress?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "milestone_estimate_version_id_fkey"
            columns: ["estimate_version_id"]
            isOneToOne: false
            referencedRelation: "estimate_version"
            referencedColumns: ["estimate_version_id"]
          },
        ]
      }
      payment: {
        Row: {
          milestone_id: number | null
          payment_amount: string | null
          payment_date: string | null
          payment_id: number
          payment_method: string | null
          payment_status: string | null
        }
        Insert: {
          milestone_id?: number | null
          payment_amount?: string | null
          payment_date?: string | null
          payment_id: number
          payment_method?: string | null
          payment_status?: string | null
        }
        Update: {
          milestone_id?: number | null
          payment_amount?: string | null
          payment_date?: string | null
          payment_id?: number
          payment_method?: string | null
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestone"
            referencedColumns: ["milestone_id"]
          },
        ]
      }
      team_counsel: {
        Row: {
          client_id: string
          counsel_date: string | null
          counsel_status: string | null
          manager_id: string | null
          team_counsel_id: number
          team_id: number | null
        }
        Insert: {
          client_id?: string
          counsel_date?: string | null
          counsel_status?: string | null
          manager_id?: string | null
          team_counsel_id?: number
          team_id?: number | null
        }
        Update: {
          client_id?: string
          counsel_date?: string | null
          counsel_status?: string | null
          manager_id?: string | null
          team_counsel_id?: number
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_counsel_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_counsel_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_counsel_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: number
          maker_id: string | null
          status: string | null
          team_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          maker_id?: string | null
          status?: string | null
          team_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          maker_id?: string | null
          status?: string | null
          team_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_project: {
        Row: {
          estimate_id: number | null
          estimate_status: string | null
          project_end_date: string | null
          project_name: string | null
          project_start_date: string | null
          team_id: number | null
          team_project_id: number
        }
        Insert: {
          estimate_id?: number | null
          estimate_status?: string | null
          project_end_date?: string | null
          project_name?: string | null
          project_start_date?: string | null
          team_id?: number | null
          team_project_id?: number
        }
        Update: {
          estimate_id?: number | null
          estimate_status?: string | null
          project_end_date?: string | null
          project_name?: string | null
          project_start_date?: string | null
          team_id?: number | null
          team_project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_project_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "team_project_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_proposals: {
        Row: {
          created_at: string
          id: number
          maker_id: string
          manager_id: string
          team_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          maker_id: string
          manager_id?: string
          team_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          maker_id?: string
          manager_id?: string
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maker-proposal_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "maker-proposal_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          id: number
          counsel_id: number
          maker_id: string
          assigned_by: string
          assignment_status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          counsel_id: number
          maker_id: string
          assigned_by: string
          assignment_status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          counsel_id?: number
          maker_id?: string
          assigned_by?: string
          assignment_status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_counsel_id_fkey"
            columns: ["counsel_id"]
            isOneToOne: false
            referencedRelation: "counsel"
            referencedColumns: ["counsel_id"]
          },
          {
            foreignKeyName: "project_assignments_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_participation: {
        Row: {
          id: number
          counsel_id: number
          maker_id: string
          participation_status: 'pending' | 'interested' | 'not_interested'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          counsel_id: number
          maker_id: string
          participation_status?: 'pending' | 'interested' | 'not_interested'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          counsel_id?: number
          maker_id?: string
          participation_status?: 'pending' | 'interested' | 'not_interested'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_participation_counsel_id_fkey"
            columns: ["counsel_id"]
            isOneToOne: false
            referencedRelation: "counsel"
            referencedColumns: ["counsel_id"]
          },
          {
            foreignKeyName: "project_participation_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_estimates: {
        Row: {
          id: number
          counsel_id: number
          maker_id: string
          estimate_amount: number
          estimate_period: string
          estimate_details: string
          estimate_status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          counsel_id: number
          maker_id: string
          estimate_amount: number
          estimate_period: string
          estimate_details: string
          estimate_status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          counsel_id?: number
          maker_id?: string
          estimate_amount?: number
          estimate_period?: string
          estimate_details?: string
          estimate_status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_estimates_counsel_id_fkey"
            columns: ["counsel_id"]
            isOneToOne: false
            referencedRelation: "counsel"
            referencedColumns: ["counsel_id"]
          },
          {
            foreignKeyName: "maker_estimates_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teams: {
        Row: {
          bio: string
          created_at: string
          deleted_at: string | null
          id: number
          manager_id: string
          name: string
          prefered: string[]
          specialty: Database["public"]["Enums"]["team_specialty"][]
          sub_specialty: string[]
          updated_at: string
        }
        Insert: {
          bio: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          manager_id?: string
          name: string
          prefered: string[]
          specialty: Database["public"]["Enums"]["team_specialty"][]
          sub_specialty: string[]
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          manager_id?: string
          name?: string
          prefered?: string[]
          specialty?: Database["public"]["Enums"]["team_specialty"][]
          sub_specialty?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_manager_id_fkey1"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_manager_id_fkey2"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_process_management:
        | "IT 프로젝트 관리"
        | "비즈니스 프로세스 개선"
        | "제품 기획 및 관리"
        | "프로젝트 일정 관리"
        | "성과 및 팀 목표 관리"
      cloud_and_infra:
        | "클라우드 인프라(AWS, Azure, GCP)"
        | "컨테이너 오케스트레이션(Docker, Kubernetes)"
        | "CI/CD 파이프라인 구축"
        | "서비스 아키텍처 설계"
        | "인프라 자동화(Terraform, Ansible)"
      counsel_cost:
        | "500만원 이하"
        | "500만원 ~ 1000만원"
        | "1000만원 ~ 5000만원"
        | "5000만원 ~ 1억원"
      counsel_period:
        | "1개월 이하"
        | "1개월 ~ 3개월"
        | "3개월 ~ 6개월"
        | "6개월 ~ 1년"
      counsel_status: "pending" | "recruiting" | "end"
      data_and_ai:
        | "데이터 분석 및 처리"
        | "머신러닝 및 인공지능"
        | "데이터 시각화"
        | "데이터베이스 설계 및 최적화"
        | "자연어 처리(NLP)"
        | "데이터 마이그레이션 및 ETL"
      estimate_status: "pending" | "accept" | "in_progress"
      maker_proposal_status:
        | "PROPOSED"
        | "REJECTED"
        | "CANCEL"
        | "ACCEPTED"
        | "NOT_PROPOSED"
      message_type: "message" | "card" | "attachment"
      milestone_status:
        | "pending"
        | "in_progress"
        | "completed_payment"
        | "task_completed"
      others:
        | "AR/VR 애플리케이션 개발"
        | "로봇 공학(Robotics) 개발"
        | "하드웨어 통합 및 개발"
      project_feild:
        | "웹 개발"
        | "앱 개발"
        | "인공지능"
        | "서버 개발"
        | "클라우드"
        | "CI/CD"
        | "데이터베이스"
        | "디자인"
        | "보안"
      security_and_testing:
        | "애플리케이션 보안"
        | "네트워크 보안"
        | "침투 테스트 및 취약점 분석"
        | "QA 및 소프트웨어 테스트 관리"
        | "보안 컴플라이언스 관리"
      skill: "java" | "ios" | "llm" | "db"
      team_specialty:
        | "웹 및 모바일 개발"
        | "데이터 및 인공지능"
        | "클라우드 및 인프라"
        | "보안 및 테스트"
        | "비즈니스 프로세스 관리"
        | "기타"
      user_role: "MAKER" | "MANAGER" | "NONE"
      web_and_mobile_development:
        | "앱 애플리케이션 개발"
        | "모바일 개발 (iOS, Android)"
        | "전자상거래 플랫폼 개발"
        | "전자결제 모듈 개발"
        | "관리자 시스템(CMS) 개발"
        | "API 개발 및 운영"
        | "SaaS(Software as a Service) 개발"
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
      business_process_management: [
        "IT 프로젝트 관리",
        "비즈니스 프로세스 개선",
        "제품 기획 및 관리",
        "프로젝트 일정 관리",
        "성과 및 팀 목표 관리",
      ],
      cloud_and_infra: [
        "클라우드 인프라(AWS, Azure, GCP)",
        "컨테이너 오케스트레이션(Docker, Kubernetes)",
        "CI/CD 파이프라인 구축",
        "서비스 아키텍처 설계",
        "인프라 자동화(Terraform, Ansible)",
      ],
      counsel_cost: [
        "500만원 이하",
        "500만원 ~ 1000만원",
        "1000만원 ~ 5000만원",
        "5000만원 ~ 1억원",
      ],
      counsel_period: [
        "1개월 이하",
        "1개월 ~ 3개월",
        "3개월 ~ 6개월",
        "6개월 ~ 1년",
      ],
      counsel_status: ["pending", "recruiting", "end"],
      data_and_ai: [
        "데이터 분석 및 처리",
        "머신러닝 및 인공지능",
        "데이터 시각화",
        "데이터베이스 설계 및 최적화",
        "자연어 처리(NLP)",
        "데이터 마이그레이션 및 ETL",
      ],
      estimate_status: ["pending", "accept", "in_progress"],
      maker_proposal_status: [
        "PROPOSED",
        "REJECTED",
        "CANCEL",
        "ACCEPTED",
        "NOT_PROPOSED",
      ],
      message_type: ["message", "card", "attachment"],
      milestone_status: [
        "pending",
        "in_progress",
        "completed_payment",
        "task_completed",
      ],
      others: [
        "AR/VR 애플리케이션 개발",
        "로봇 공학(Robotics) 개발",
        "하드웨어 통합 및 개발",
      ],
      project_feild: [
        "웹 개발",
        "앱 개발",
        "인공지능",
        "서버 개발",
        "클라우드",
        "CI/CD",
        "데이터베이스",
        "디자인",
        "보안",
      ],
      security_and_testing: [
        "애플리케이션 보안",
        "네트워크 보안",
        "침투 테스트 및 취약점 분석",
        "QA 및 소프트웨어 테스트 관리",
        "보안 컴플라이언스 관리",
      ],
      skill: ["java", "ios", "llm", "db"],
      team_specialty: [
        "웹 및 모바일 개발",
        "데이터 및 인공지능",
        "클라우드 및 인프라",
        "보안 및 테스트",
        "비즈니스 프로세스 관리",
        "기타",
      ],
      user_role: ["MAKER", "MANAGER", "NONE"],
      web_and_mobile_development: [
        "앱 애플리케이션 개발",
        "모바일 개발 (iOS, Android)",
        "전자상거래 플랫폼 개발",
        "전자결제 모듈 개발",
        "관리자 시스템(CMS) 개발",
        "API 개발 및 운영",
        "SaaS(Software as a Service) 개발",
      ],
    },
  },
} as const
