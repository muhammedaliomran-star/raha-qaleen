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
  public: {
    Tables: {
      ads: {
        Row: {
          created_at: string
          cta: string
          description: string
          id: string
          image: string
          is_active: boolean
          order: number
          title: string
        }
        Insert: {
          created_at?: string
          cta?: string
          description?: string
          id?: string
          image: string
          is_active?: boolean
          order?: number
          title: string
        }
        Update: {
          created_at?: string
          cta?: string
          description?: string
          id?: string
          image?: string
          is_active?: boolean
          order?: number
          title?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          availability_id: string | null
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at: string
          date: string
          date_iso: string | null
          doctor_id: string
          doctor_name: string
          id: string
          patient_id: string
          patient_name: string
          status: Database["public"]["Enums"]["booking_status"]
          time: string
        }
        Insert: {
          availability_id?: string | null
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          date: string
          date_iso?: string | null
          doctor_id: string
          doctor_name: string
          id?: string
          patient_id: string
          patient_name: string
          status?: Database["public"]["Enums"]["booking_status"]
          time: string
        }
        Update: {
          availability_id?: string | null
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          date?: string
          date_iso?: string | null
          doctor_id?: string
          doctor_name?: string
          id?: string
          patient_id?: string
          patient_name?: string
          status?: Database["public"]["Enums"]["booking_status"]
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_availability_id_fkey"
            columns: ["availability_id"]
            isOneToOne: false
            referencedRelation: "doctor_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          booking_id: string | null
          created_at: string
          date: string
          doctor_id: string
          id: string
          is_booked: boolean
          time: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          date: string
          doctor_id: string
          id?: string
          is_booked?: boolean
          time: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          date?: string
          doctor_id?: string
          id?: string
          is_booked?: boolean
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          area: string
          bio: string
          city: string
          created_at: string
          governorate: string
          id: string
          image: string
          name: string
          patients_count: number
          price: number
          rating: number
          specialty: string
          times: string[]
          whatsapp_number: string | null
        }
        Insert: {
          area: string
          bio?: string
          city?: string
          created_at?: string
          governorate?: string
          id?: string
          image?: string
          name: string
          patients_count?: number
          price?: number
          rating?: number
          specialty: string
          times?: string[]
          whatsapp_number?: string | null
        }
        Update: {
          area?: string
          bio?: string
          city?: string
          created_at?: string
          governorate?: string
          id?: string
          image?: string
          name?: string
          patients_count?: number
          price?: number
          rating?: number
          specialty?: string
          times?: string[]
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          phone: string
          updated_at: string
          username: string
        }
        Insert: {
          age: number
          created_at?: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          phone: string
          updated_at?: string
          username: string
        }
        Update: {
          age?: number
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          phone?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_slot: {
        Args: {
          _availability_id: string
          _booking_type?: Database["public"]["Enums"]["booking_type"]
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      seed_availability_for_all: {
        Args: { _days?: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "receptionist" | "admin"
      booking_status: "upcoming" | "done" | "cancelled"
      booking_type: "new" | "followup"
      gender_type: "male" | "female"
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
      app_role: ["patient", "doctor", "receptionist", "admin"],
      booking_status: ["upcoming", "done", "cancelled"],
      booking_type: ["new", "followup"],
      gender_type: ["male", "female"],
    },
  },
} as const
