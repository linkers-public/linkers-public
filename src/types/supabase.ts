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
          client_id: number
          client_status: string | null
          company_name: string | null
          contact_info: string | null
          created_at: string | null
          email: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: number
          client_status?: string | null
          company_name?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: number
          client_status?: string | null
          company_name?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      counsel: {
        Row: {
          client_id: number | null
          cost: number
          counsel_date: string | null
          counsel_id: number
          counsel_status: Database["public"]["Enums"]["counsel_status"]
          counsel_type: string | null
          due_date: string
          feild: Database["public"]["Enums"]["project_feild"] | null
          outline: string | null
          output: string | null
          skill: Database["public"]["Enums"]["skill"][] | null
          start_date: string
          title: string | null
        }
        Insert: {
          client_id?: number | null
          cost?: number
          counsel_date?: string | null
          counsel_id?: number
          counsel_status?: Database["public"]["Enums"]["counsel_status"]
          counsel_type?: string | null
          due_date?: string
          feild?: Database["public"]["Enums"]["project_feild"] | null
          outline?: string | null
          output?: string | null
          skill?: Database["public"]["Enums"]["skill"][] | null
          start_date?: string
          title?: string | null
        }
        Update: {
          client_id?: number | null
          cost?: number
          counsel_date?: string | null
          counsel_id?: number
          counsel_status?: Database["public"]["Enums"]["counsel_status"]
          counsel_type?: string | null
          due_date?: string
          feild?: Database["public"]["Enums"]["project_feild"] | null
          outline?: string | null
          output?: string | null
          skill?: Database["public"]["Enums"]["skill"][] | null
          start_date?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counsel_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["client_id"]
          },
        ]
      }
      estimate: {
        Row: {
          client_id: number
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
          client_id: number
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
          client_id?: number
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
            referencedColumns: ["client_id"]
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
      manager_bookmarks: {
        Row: {
          created_at: string
          id: number
          is_proposal: boolean
          maker_id: string
          manager_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_proposal: boolean
          maker_id: string
          manager_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_proposal?: boolean
          maker_id?: string
          manager_id?: string
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
          estimate_id: number | null
          estimate_version_id: number | null
          milestone_due_date: string | null
          milestone_id: number
          milestone_start_date: string | null
          milestone_status: string | null
          payment_amount: string | null
          title: string | null
        }
        Insert: {
          estimate_id?: number | null
          estimate_version_id?: number | null
          milestone_due_date?: string | null
          milestone_id: number
          milestone_start_date?: string | null
          milestone_status?: string | null
          payment_amount?: string | null
          title?: string | null
        }
        Update: {
          estimate_id?: number | null
          estimate_version_id?: number | null
          milestone_due_date?: string | null
          milestone_id?: number
          milestone_start_date?: string | null
          milestone_status?: string | null
          payment_amount?: string | null
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
          client_id: number | null
          milestone_id: number | null
          payment_amount: string | null
          payment_date: string | null
          payment_id: number
          payment_method: string | null
          payment_status: string | null
        }
        Insert: {
          client_id?: number | null
          milestone_id?: number | null
          payment_amount?: string | null
          payment_date?: string | null
          payment_id: number
          payment_method?: string | null
          payment_status?: string | null
        }
        Update: {
          client_id?: number | null
          milestone_id?: number | null
          payment_amount?: string | null
          payment_date?: string | null
          payment_id?: number
          payment_method?: string | null
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["client_id"]
          },
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
          client_id: number | null
          counsel_date: string | null
          counsel_id: number | null
          counsel_status: string | null
          manager_id: string | null
          team_counsel_id: number
          team_id: number | null
        }
        Insert: {
          client_id?: number | null
          counsel_date?: string | null
          counsel_id?: number | null
          counsel_status?: string | null
          manager_id?: string | null
          team_counsel_id?: number
          team_id?: number | null
        }
        Update: {
          client_id?: number | null
          counsel_date?: string | null
          counsel_id?: number | null
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
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "team_counsel_counsel_id_fkey"
            columns: ["counsel_id"]
            isOneToOne: false
            referencedRelation: "counsel"
            referencedColumns: ["counsel_id"]
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
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          maker_id: string
          manager_id?: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          maker_id?: string
          manager_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_proposals_maker_id_fkey1"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_proposals_manager_id_fkey1"
            columns: ["manager_id"]
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
      counsel_status: "pending" | "recruiting" | "end"
      data_and_ai:
        | "데이터 분석 및 처리"
        | "머신러닝 및 인공지능"
        | "데이터 시각화"
        | "데이터베이스 설계 및 최적화"
        | "자연어 처리(NLP)"
        | "데이터 마이그레이션 및 ETL"
      estimate_status: "pending" | "accept"
      message_type: "message" | "card" | "attachment"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
