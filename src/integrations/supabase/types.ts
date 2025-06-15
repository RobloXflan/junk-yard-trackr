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
      buyers: {
        Row: {
          address: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_processing_logs: {
        Row: {
          created_at: string
          email_from: string
          email_subject: string | null
          error_message: string | null
          filter_reason: string | null
          id: string
          pending_intake_id: string | null
          processing_status: string
        }
        Insert: {
          created_at?: string
          email_from: string
          email_subject?: string | null
          error_message?: string | null
          filter_reason?: string | null
          id?: string
          pending_intake_id?: string | null
          processing_status: string
        }
        Update: {
          created_at?: string
          email_from?: string
          email_subject?: string | null
          error_message?: string | null
          filter_reason?: string | null
          id?: string
          pending_intake_id?: string | null
          processing_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_processing_logs_pending_intake_id_fkey"
            columns: ["pending_intake_id"]
            isOneToOne: false
            referencedRelation: "pending_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_intakes: {
        Row: {
          confidence_score: number | null
          created_at: string
          documents: Json | null
          email_body: string | null
          email_from: string
          email_received_at: string
          email_subject: string | null
          extracted_info: Json | null
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          documents?: Json | null
          email_body?: string | null
          email_from: string
          email_received_at?: string
          email_subject?: string | null
          extracted_info?: Json | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          documents?: Json | null
          email_body?: string | null
          email_from?: string
          email_received_at?: string
          email_subject?: string | null
          extracted_info?: Json | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_intakes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_submissions: {
        Row: {
          created_at: string
          damage_notes: string | null
          email: string | null
          has_title: string
          id: string
          make: string
          model: string
          name: string
          phone: string
          photo_url: string | null
          title_other: string | null
          updated_at: string
          vehicle_condition: string | null
          year: string
        }
        Insert: {
          created_at?: string
          damage_notes?: string | null
          email?: string | null
          has_title: string
          id?: string
          make: string
          model: string
          name: string
          phone: string
          photo_url?: string | null
          title_other?: string | null
          updated_at?: string
          vehicle_condition?: string | null
          year: string
        }
        Update: {
          created_at?: string
          damage_notes?: string | null
          email?: string | null
          has_title?: string
          id?: string
          make?: string
          model?: string
          name?: string
          phone?: string
          photo_url?: string | null
          title_other?: string | null
          updated_at?: string
          vehicle_condition?: string | null
          year?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          bill_of_sale: boolean | null
          buyer_first_name: string | null
          buyer_last_name: string | null
          buyer_name: string | null
          created_at: string
          destination: string | null
          dmv_confirmation_number: string | null
          dmv_status: string | null
          dmv_submitted_at: string | null
          documents: Json | null
          id: string
          license_plate: string | null
          make: string
          model: string
          notes: string | null
          paperwork: string | null
          paperwork_other: string | null
          purchase_date: string | null
          purchase_price: string | null
          sale_date: string | null
          sale_price: string | null
          seller_name: string | null
          status: string | null
          title_present: boolean | null
          updated_at: string
          vehicle_id: string
          year: string
        }
        Insert: {
          bill_of_sale?: boolean | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_name?: string | null
          created_at?: string
          destination?: string | null
          dmv_confirmation_number?: string | null
          dmv_status?: string | null
          dmv_submitted_at?: string | null
          documents?: Json | null
          id?: string
          license_plate?: string | null
          make: string
          model: string
          notes?: string | null
          paperwork?: string | null
          paperwork_other?: string | null
          purchase_date?: string | null
          purchase_price?: string | null
          sale_date?: string | null
          sale_price?: string | null
          seller_name?: string | null
          status?: string | null
          title_present?: boolean | null
          updated_at?: string
          vehicle_id: string
          year: string
        }
        Update: {
          bill_of_sale?: boolean | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_name?: string | null
          created_at?: string
          destination?: string | null
          dmv_confirmation_number?: string | null
          dmv_status?: string | null
          dmv_submitted_at?: string | null
          documents?: Json | null
          id?: string
          license_plate?: string | null
          make?: string
          model?: string
          notes?: string | null
          paperwork?: string | null
          paperwork_other?: string | null
          purchase_date?: string | null
          purchase_price?: string | null
          sale_date?: string | null
          sale_price?: string | null
          seller_name?: string | null
          status?: string | null
          title_present?: boolean | null
          updated_at?: string
          vehicle_id?: string
          year?: string
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
