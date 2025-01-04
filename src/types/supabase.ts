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
          content: string
          created_at: string
          end_date: string | null
          id: number
          name: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string
          content: string
          created_at?: string
          end_date?: string | null
          id?: number
          name?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string
          end_date?: string | null
          id?: number
          name?: string | null
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
        }
        Relationships: []
      }
      manger_boomarks: {
        Row: {
          created_at: string
          id: number
          maker_id: string
          manager_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          maker_id: string
          manager_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          maker_id?: string
          manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manger_boomarks_maker_id_fkey1"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manger_boomarks_manager_id_fkey1"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id"]
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
          deleted_at: string
          id: number
          manager_id: string
          name: string
          preffered: string[]
          specialty: Database["public"]["Enums"]["team_specialty"][]
          sub_specialty: string[]
          updated_at: string
        }
        Insert: {
          bio: string
          created_at?: string
          deleted_at: string
          id?: number
          manager_id?: string
          name: string
          preffered: string[]
          specialty: Database["public"]["Enums"]["team_specialty"][]
          sub_specialty: string[]
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          deleted_at?: string
          id?: number
          manager_id?: string
          name?: string
          preffered?: string[]
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
      data_and_ai:
        | "데이터 분석 및 처리"
        | "머신러닝 및 인공지능"
        | "데이터 시각화"
        | "데이터베이스 설계 및 최적화"
        | "자연어 처리(NLP)"
        | "데이터 마이그레이션 및 ETL"
      others:
        | "AR/VR 애플리케이션 개발"
        | "로봇 공학(Robotics) 개발"
        | "하드웨어 통합 및 개발"
      security_and_testing:
        | "애플리케이션 보안"
        | "네트워크 보안"
        | "침투 테스트 및 취약점 분석"
        | "QA 및 소프트웨어 테스트 관리"
        | "보안 컴플라이언스 관리"
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
