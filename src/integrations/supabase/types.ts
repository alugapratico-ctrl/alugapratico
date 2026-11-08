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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          id: string
          kind: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          text: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: string
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: string
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: string
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      client_fines: {
        Row: {
          amount: number
          attachment_path: string | null
          client_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          infraction_date: string
          notes: string | null
          product_id: string | null
          rental_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          attachment_path?: string | null
          client_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          infraction_date: string
          notes?: string | null
          product_id?: string | null
          rental_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          attachment_path?: string | null
          client_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          infraction_date?: string
          notes?: string | null
          product_id?: string | null
          rental_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_fines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_fines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_fines_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          channel: string
          client_id: string
          created_at: string
          id: string
          message: string
          rental_id: string | null
          status: string
          template: string
          user_id: string
        }
        Insert: {
          channel: string
          client_id: string
          created_at?: string
          id?: string
          message: string
          rental_id?: string | null
          status: string
          template: string
          user_id: string
        }
        Update: {
          channel?: string
          client_id?: string
          created_at?: string
          id?: string
          message?: string
          rental_id?: string | null
          status?: string
          template?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          link_id: string | null
          link_type: string | null
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          link_id?: string | null
          link_type?: string | null
          priority: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          link_id?: string | null
          link_type?: string | null
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      product_records: {
        Row: {
          amount: number
          attachments: string[]
          category: string
          created_at: string
          date: string
          description: string
          id: string
          kind: string
          notes: string | null
          product_id: string
          provider: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          attachments?: string[]
          category: string
          created_at?: string
          date: string
          description?: string
          id?: string
          kind: string
          notes?: string | null
          product_id: string
          provider?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          attachments?: string[]
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          kind?: string
          notes?: string | null
          product_id?: string
          provider?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          acquisition_value: number | null
          available: boolean
          billing: string
          category: string
          created_at: string
          daily_price: number | null
          description: string
          details: Json
          documents: string[]
          id: string
          maintenance: boolean
          monthly_price: number | null
          name: string
          notes: string | null
          photo_path: string | null
          price: number
          updated_at: string
          user_id: string
          vehicle: Json | null
          weekly_price: number | null
        }
        Insert: {
          acquisition_value?: number | null
          available?: boolean
          billing: string
          category: string
          created_at?: string
          daily_price?: number | null
          description?: string
          details?: Json
          documents?: string[]
          id?: string
          maintenance?: boolean
          monthly_price?: number | null
          name: string
          notes?: string | null
          photo_path?: string | null
          price: number
          updated_at?: string
          user_id?: string
          vehicle?: Json | null
          weekly_price?: number | null
        }
        Update: {
          acquisition_value?: number | null
          available?: boolean
          billing?: string
          category?: string
          created_at?: string
          daily_price?: number | null
          description?: string
          details?: Json
          documents?: string[]
          id?: string
          maintenance?: boolean
          monthly_price?: number | null
          name?: string
          notes?: string | null
          photo_path?: string | null
          price?: number
          updated_at?: string
          user_id?: string
          vehicle?: Json | null
          weekly_price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_access_at: string | null
          phone: string | null
          preferences: Json
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_access_at?: string | null
          phone?: string | null
          preferences?: Json
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_access_at?: string | null
          phone?: string | null
          preferences?: Json
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rentals: {
        Row: {
          client_id: string
          created_at: string
          end_date: string
          id: string
          paid: boolean
          product_id: string
          start_date: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date: string
          id?: string
          paid?: boolean
          product_id: string
          start_date: string
          status: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string
          id?: string
          paid?: boolean
          product_id?: string
          start_date?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_log_view: { Args: never; Returns: undefined }
      admin_overview: {
        Args: never
        Returns: {
          active_rentals: number
          business_name: string
          city: string
          clients: number
          created_at: string
          email: string
          full_name: string
          is_admin: boolean
          last_access_at: string
          last_activity: string
          messages: number
          phone: string
          products: number
          rentals: number
          returned: number
          user_id: string
        }[]
      }
      admin_set_role: {
        Args: { _make_admin: boolean; _target: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
