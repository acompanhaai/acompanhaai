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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: number
          payload: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: number
          payload?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: number
          payload?: Json | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          accept_rate: number
          avg_minutes: number
          city: string | null
          cpf: string
          created_at: string
          id: string
          last_lat: number | null
          last_lng: number | null
          last_seen: string | null
          name: string
          phone: string | null
          photo_url: string | null
          plate: string | null
          provider: string | null
          re: string
          status: string
          user_id: string | null
          vehicle: string | null
        }
        Insert: {
          accept_rate?: number
          avg_minutes?: number
          city?: string | null
          cpf: string
          created_at?: string
          id?: string
          last_lat?: number | null
          last_lng?: number | null
          last_seen?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          plate?: string | null
          provider?: string | null
          re: string
          status?: string
          user_id?: string | null
          vehicle?: string | null
        }
        Update: {
          accept_rate?: number
          avg_minutes?: number
          city?: string | null
          cpf?: string
          created_at?: string
          id?: string
          last_lat?: number | null
          last_lng?: number | null
          last_seen?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          plate?: string | null
          provider?: string | null
          re?: string
          status?: string
          user_id?: string | null
          vehicle?: string | null
        }
        Relationships: []
      }
      insureds: {
        Row: {
          cpf: string | null
          created_at: string
          id: string
          insurer: string | null
          name: string
          phone: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          id?: string
          insurer?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          id?: string
          insurer?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      location_history: {
        Row: {
          created_at: string
          driver_id: string | null
          id: number
          lat: number
          lng: number
          protocol_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: number
          lat: number
          lng: number
          protocol_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: number
          lat?: number
          lng?: number
          protocol_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_history_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_history_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          protocol_id: string
          read_at: string | null
          sender_id: string | null
          sender_name: string | null
          sender_role: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          protocol_id: string
          read_at?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_role: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          protocol_id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string
          id: string
          name?: string
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      protocol_codes: {
        Row: {
          code: string
          created_at: string
          protocol_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          protocol_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          protocol_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_codes_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: true
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          protocol_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          protocol_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          protocol_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_events_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          accepted_at: string | null
          address_cep: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          arrived_at: string | null
          cancelled_at: string | null
          city: string | null
          client_cpf: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          destination: string | null
          driver_id: string | null
          en_route_at: string | null
          finished_at: string | null
          id: string
          insurer: string | null
          notes: string | null
          number: string
          origin: string
          origin_lat: number | null
          origin_lng: number | null
          priority: string
          service_started_at: string | null
          service_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          address_cep?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          arrived_at?: string | null
          cancelled_at?: string | null
          city?: string | null
          client_cpf?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          driver_id?: string | null
          en_route_at?: string | null
          finished_at?: string | null
          id?: string
          insurer?: string | null
          notes?: string | null
          number: string
          origin: string
          origin_lat?: number | null
          origin_lng?: number | null
          priority?: string
          service_started_at?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          address_cep?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          arrived_at?: string | null
          cancelled_at?: string | null
          city?: string | null
          client_cpf?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          driver_id?: string | null
          en_route_at?: string | null
          finished_at?: string | null
          id?: string
          insurer?: string | null
          notes?: string | null
          number?: string
          origin?: string
          origin_lat?: number | null
          origin_lng?: number | null
          priority?: string
          service_started_at?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocols_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
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
      current_driver_id: { Args: never; Returns: string }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      is_valid_br_phone: { Args: { value: string }; Returns: boolean }
      is_valid_cpf: { Args: { value: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "operator" | "driver"
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
      app_role: ["admin", "operator", "driver"],
    },
  },
} as const
