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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_placements: {
        Row: {
          ad_type: Database["public"]["Enums"]["ad_type"]
          availability: Database["public"]["Enums"]["ad_availability"]
          created_at: string
          description: string | null
          height_m: number | null
          id: string
          is_active: boolean
          lighting: string | null
          monthly_price: number
          photo: string | null
          property_id: string
          side: string | null
          title: string
          traffic: Database["public"]["Enums"]["ad_traffic"]
          updated_at: string
          width_m: number | null
        }
        Insert: {
          ad_type: Database["public"]["Enums"]["ad_type"]
          availability?: Database["public"]["Enums"]["ad_availability"]
          created_at?: string
          description?: string | null
          height_m?: number | null
          id?: string
          is_active?: boolean
          lighting?: string | null
          monthly_price?: number
          photo?: string | null
          property_id: string
          side?: string | null
          title?: string
          traffic?: Database["public"]["Enums"]["ad_traffic"]
          updated_at?: string
          width_m?: number | null
        }
        Update: {
          ad_type?: Database["public"]["Enums"]["ad_type"]
          availability?: Database["public"]["Enums"]["ad_availability"]
          created_at?: string
          description?: string | null
          height_m?: number | null
          id?: string
          is_active?: boolean
          lighting?: string | null
          monthly_price?: number
          photo?: string | null
          property_id?: string
          side?: string | null
          title?: string
          traffic?: Database["public"]["Enums"]["ad_traffic"]
          updated_at?: string
          width_m?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_placements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invoices: {
        Row: {
          amount: number
          binding_id: string
          created_at: string
          due_date: string | null
          id: string
          note: string | null
          status: string
          title: string
        }
        Insert: {
          amount: number
          binding_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          status?: string
          title: string
        }
        Update: {
          amount?: number
          binding_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invoices_binding_id_fkey"
            columns: ["binding_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_bindings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          binding_id: string
          created_at: string
          direction: string
          id: string
          message: string
        }
        Insert: {
          binding_id: string
          created_at?: string
          direction?: string
          id?: string
          message: string
        }
        Update: {
          binding_id?: string
          created_at?: string
          direction?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_binding_id_fkey"
            columns: ["binding_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_bindings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tenant_bindings: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          landlord_name: string | null
          lease_until: string | null
          manager_name: string | null
          monthly_rent: number | null
          object_id: string
          phone: string | null
          tenant_name: string
          utilities_monthly: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          landlord_name?: string | null
          lease_until?: string | null
          manager_name?: string | null
          monthly_rent?: number | null
          object_id: string
          phone?: string | null
          tenant_name: string
          utilities_monthly?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          landlord_name?: string | null
          lease_until?: string | null
          manager_name?: string | null
          monthly_rent?: number | null
          object_id?: string
          phone?: string | null
          tenant_name?: string
          utilities_monthly?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_tenant_bindings_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          object_id: string | null
          payload: Json
          source_page: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          object_id?: string | null
          payload?: Json
          source_page: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          object_id?: string | null
          payload?: Json
          source_page?: string
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          business_category: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          object_id: string | null
          phone: string | null
          source: string
          status: string
        }
        Insert: {
          business_category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          object_id?: string | null
          phone?: string | null
          source: string
          status?: string
        }
        Update: {
          business_category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          object_id?: string | null
          phone?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          address: string
          area: number
          ceiling_height: number | null
          class: string | null
          condition: string | null
          contract_term: number | null
          cover_photo: string | null
          created_at: string
          deal_type: string
          deposit: number | null
          description: string | null
          district: string | null
          floor: number | null
          id: string
          is_active: boolean
          manager_id: string | null
          parking: boolean | null
          photos: Json
          price: number | null
          price_per_m2: number | null
          published_date: string
          total_floors: number | null
          type: string
          views_count: number
        }
        Insert: {
          address: string
          area: number
          ceiling_height?: number | null
          class?: string | null
          condition?: string | null
          contract_term?: number | null
          cover_photo?: string | null
          created_at?: string
          deal_type: string
          deposit?: number | null
          description?: string | null
          district?: string | null
          floor?: number | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          parking?: boolean | null
          photos?: Json
          price?: number | null
          price_per_m2?: number | null
          published_date?: string
          total_floors?: number | null
          type: string
          views_count?: number
        }
        Update: {
          address?: string
          area?: number
          ceiling_height?: number | null
          class?: string | null
          condition?: string | null
          contract_term?: number | null
          cover_photo?: string | null
          created_at?: string
          deal_type?: string
          deposit?: number | null
          description?: string | null
          district?: string | null
          floor?: number | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          parking?: boolean | null
          photos?: Json
          price?: number | null
          price_per_m2?: number | null
          published_date?: string
          total_floors?: number | null
          type?: string
          views_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          area: number
          ceiling_height: number | null
          class: string
          client_id: string | null
          condition: string | null
          contract_term: string | null
          cover_photo: string | null
          created_at: string
          deal_type: string
          deposit: string | null
          description: string | null
          district: string
          features: string[] | null
          floor: string | null
          id: string
          is_active: boolean | null
          lat: number | null
          layout: string | null
          lng: number | null
          manager_id: string | null
          parking: string | null
          photos: string[] | null
          photos_count: number | null
          price: number
          price_per_m2: number
          published_date: string | null
          total_floors: number | null
          type: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          address?: string
          area?: number
          ceiling_height?: number | null
          class?: string
          client_id?: string | null
          condition?: string | null
          contract_term?: string | null
          cover_photo?: string | null
          created_at?: string
          deal_type?: string
          deposit?: string | null
          description?: string | null
          district?: string
          features?: string[] | null
          floor?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          layout?: string | null
          lng?: number | null
          manager_id?: string | null
          parking?: string | null
          photos?: string[] | null
          photos_count?: number | null
          price?: number
          price_per_m2?: number
          published_date?: string | null
          total_floors?: number | null
          type?: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          address?: string
          area?: number
          ceiling_height?: number | null
          class?: string
          client_id?: string | null
          condition?: string | null
          contract_term?: string | null
          cover_photo?: string | null
          created_at?: string
          deal_type?: string
          deposit?: string | null
          description?: string | null
          district?: string
          features?: string[] | null
          floor?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          layout?: string | null
          lng?: number | null
          manager_id?: string | null
          parking?: string | null
          photos?: string[] | null
          photos_count?: number | null
          price?: number
          price_per_m2?: number
          published_date?: string | null
          total_floors?: number | null
          type?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_availability: "available" | "occupied" | "reserved"
      ad_traffic: "low" | "medium" | "high"
      ad_type:
        | "billboard"
        | "pavilion_paint"
        | "led_running_line"
        | "roof_sign"
        | "facade_banner"
        | "window_sticker"
        | "pillar_wrap"
        | "wall_mural"
        | "sidewalk_stand"
        | "digital_screen"
        | "flag_pole"
      app_role: "admin" | "manager" | "client"
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
      ad_availability: ["available", "occupied", "reserved"],
      ad_traffic: ["low", "medium", "high"],
      ad_type: [
        "billboard",
        "pavilion_paint",
        "led_running_line",
        "roof_sign",
        "facade_banner",
        "window_sticker",
        "pillar_wrap",
        "wall_mural",
        "sidewalk_stand",
        "digital_screen",
        "flag_pole",
      ],
      app_role: ["admin", "manager", "client"],
    },
  },
} as const
