export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_notes: {
        Row: {
          appointment_booked: boolean | null
          assigned_worker_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          estimated_price: number | null
          id: string
          notes: string | null
          paperwork: string | null
          telegram_sent: boolean | null
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
        }
        Insert: {
          appointment_booked?: boolean | null
          assigned_worker_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          paperwork?: string | null
          telegram_sent?: boolean | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Update: {
          appointment_booked?: boolean | null
          assigned_worker_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          paperwork?: string | null
          telegram_sent?: boolean | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notes_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_purchases: {
        Row: {
          category: string
          created_at: string
          id: string
          item_name: string
          notes_purpose: string | null
          payment_method: string
          purchase_date: string
          purchase_price: number
          receipt_url: string | null
          updated_at: string
          vendor_store: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          item_name: string
          notes_purpose?: string | null
          payment_method: string
          purchase_date: string
          purchase_price: number
          receipt_url?: string | null
          updated_at?: string
          vendor_store: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          item_name?: string
          notes_purpose?: string | null
          payment_method?: string
          purchase_date?: string
          purchase_price?: number
          receipt_url?: string | null
          updated_at?: string
          vendor_store?: string
        }
        Relationships: []
      }
      buyers: {
        Row: {
          address: string
          city: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      call_transcripts: {
        Row: {
          appointment_note_id: string | null
          audio_duration: number | null
          created_at: string
          id: string
          transcript_text: string
          updated_at: string
        }
        Insert: {
          appointment_note_id?: string | null
          audio_duration?: number | null
          created_at?: string
          id?: string
          transcript_text: string
          updated_at?: string
        }
        Update: {
          appointment_note_id?: string | null
          audio_duration?: number | null
          created_at?: string
          id?: string
          transcript_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_appointment_note_id_fkey"
            columns: ["appointment_note_id"]
            isOneToOne: false
            referencedRelation: "appointment_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          notes: string | null
          transaction_date: string
          transaction_type: string
          worker_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          notes?: string | null
          transaction_date?: string
          transaction_type: string
          worker_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          notes?: string | null
          transaction_date?: string
          transaction_type?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_summaries: {
        Row: {
          active_workers_count: number | null
          created_at: string
          id: string
          net_change: number | null
          summary_date: string
          total_given_out: number | null
          total_turned_in: number | null
          updated_at: string
        }
        Insert: {
          active_workers_count?: number | null
          created_at?: string
          id?: string
          net_change?: number | null
          summary_date: string
          total_given_out?: number | null
          total_turned_in?: number | null
          updated_at?: string
        }
        Update: {
          active_workers_count?: number | null
          created_at?: string
          id?: string
          net_change?: number | null
          summary_date?: string
          total_given_out?: number | null
          total_turned_in?: number | null
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
      extracted_data_log: {
        Row: {
          ai_reasoning: string | null
          confidence_score: number | null
          created_at: string
          extracted_value: string | null
          field_name: string
          id: string
          transcript_id: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          confidence_score?: number | null
          created_at?: string
          extracted_value?: string | null
          field_name: string
          id?: string
          transcript_id?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          confidence_score?: number | null
          created_at?: string
          extracted_value?: string | null
          field_name?: string
          id?: string
          transcript_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_data_log_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "call_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      page_ocr_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          extracted_text: string | null
          id: string
          page_id: string
          parsed_fields: Json | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          page_id: string
          parsed_fields?: Json | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          page_id?: string
          parsed_fields?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "page_ocr_results_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pdf_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_batches: {
        Row: {
          created_at: string
          file_path: string | null
          filename: string
          id: string
          processed_pages: number
          status: string
          total_pages: number
          updated_at: string
          upload_date: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          filename: string
          id?: string
          processed_pages?: number
          status?: string
          total_pages?: number
          updated_at?: string
          upload_date?: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          filename?: string
          id?: string
          processed_pages?: number
          status?: string
          total_pages?: number
          updated_at?: string
          upload_date?: string
        }
        Relationships: []
      }
      pdf_pages: {
        Row: {
          assigned_vehicle_id: string | null
          batch_id: string
          created_at: string
          file_size: number | null
          full_page_url: string | null
          id: string
          page_number: number
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          assigned_vehicle_id?: string | null
          batch_id: string
          created_at?: string
          file_size?: number | null
          full_page_url?: string | null
          id?: string
          page_number: number
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          assigned_vehicle_id?: string | null
          batch_id?: string
          created_at?: string
          file_size?: number | null
          full_page_url?: string | null
          id?: string
          page_number?: number
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_pages_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_pages_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "pdf_batches"
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
          buyer_address: string | null
          buyer_city: string | null
          buyer_first_name: string | null
          buyer_last_name: string | null
          buyer_name: string | null
          buyer_state: string | null
          buyer_zip: string | null
          car_images: Json | null
          created_at: string
          destination: string | null
          documents: Json | null
          id: string
          is_released: boolean | null
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
          buyer_address?: string | null
          buyer_city?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_name?: string | null
          buyer_state?: string | null
          buyer_zip?: string | null
          car_images?: Json | null
          created_at?: string
          destination?: string | null
          documents?: Json | null
          id?: string
          is_released?: boolean | null
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
          buyer_address?: string | null
          buyer_city?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_name?: string | null
          buyer_state?: string | null
          buyer_zip?: string | null
          car_images?: Json | null
          created_at?: string
          destination?: string | null
          documents?: Json | null
          id?: string
          is_released?: boolean | null
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
      worker_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          final_total: number
          id: string
          money_added: number
          money_subtracted: number
          starting_cash: number
          updated_at: string
          worker_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          final_total?: number
          id?: string
          money_added?: number
          money_subtracted?: number
          starting_cash?: number
          updated_at?: string
          worker_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          final_total?: number
          id?: string
          money_added?: number
          money_subtracted?: number
          starting_cash?: number
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_checkins_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string
          hire_date: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hire_date?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hire_date?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
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
  public: {
    Enums: {},
  },
} as const
