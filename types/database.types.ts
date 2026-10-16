export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      Car: {
        Row: {
          bodyType: string;
          carColorId: string;
          carMakeId: string;
          createdAt: string;
          description: string;
          featured: boolean;
          features: string[] | null;
          fuelType: string;
          id: string;
          images: string[] | null;
          mileage: number;
          model: string;
          numberPlate: string;
          price: number;
          seats: number | null;
          status: Database["public"]["Enums"]["CarStatus"];
          storage_bytes: number;
          transmission: string;
          updatedAt: string;
          year: number;
        };
        Insert: {
          bodyType: string;
          carColorId: string;
          carMakeId: string;
          createdAt?: string;
          description: string;
          featured?: boolean;
          features?: string[] | null;
          fuelType: string;
          id: string;
          images?: string[] | null;
          mileage: number;
          model: string;
          numberPlate?: string;
          price: number;
          seats?: number | null;
          status?: Database["public"]["Enums"]["CarStatus"];
          storage_bytes?: number;
          transmission: string;
          updatedAt: string;
          year: number;
        };
        Update: {
          bodyType?: string;
          carColorId?: string;
          carMakeId?: string;
          createdAt?: string;
          description?: string;
          featured?: boolean;
          features?: string[] | null;
          fuelType?: string;
          id?: string;
          images?: string[] | null;
          mileage?: number;
          model?: string;
          numberPlate?: string;
          price?: number;
          seats?: number | null;
          status?: Database["public"]["Enums"]["CarStatus"];
          storage_bytes?: number;
          transmission?: string;
          updatedAt?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Car_carColorId_fkey";
            columns: ["carColorId"];
            isOneToOne: false;
            referencedRelation: "CarColor";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Car_carMakeId_fkey";
            columns: ["carMakeId"];
            isOneToOne: false;
            referencedRelation: "CarMake";
            referencedColumns: ["id"];
          },
        ];
      };
      CarColor: {
        Row: {
          createdAt: string;
          id: string;
          name: string;
          slug: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          id?: string;
          name: string;
          slug: string;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          id?: string;
          name?: string;
          slug?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      CarMake: {
        Row: {
          country: string | null;
          createdAt: string;
          id: string;
          name: string;
          slug: string;
          updatedAt: string;
        };
        Insert: {
          country?: string | null;
          createdAt?: string;
          id?: string;
          name: string;
          slug: string;
          updatedAt?: string;
        };
        Update: {
          country?: string | null;
          createdAt?: string;
          id?: string;
          name?: string;
          slug?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      DealershipInfo: {
        Row: {
          address: string;
          createdAt: string;
          email: string;
          id: string;
          logoSizeBytes: number | null;
          name: string;
          phone: string;
          updatedAt: string;
          whatsappPhone: string;
        };
        Insert: {
          address?: string;
          createdAt?: string;
          email?: string;
          id: string;
          logoSizeBytes?: number | null;
          name?: string;
          phone?: string;
          updatedAt: string;
          whatsappPhone?: string;
        };
        Update: {
          address?: string;
          createdAt?: string;
          email?: string;
          id?: string;
          logoSizeBytes?: number | null;
          name?: string;
          phone?: string;
          updatedAt?: string;
          whatsappPhone?: string;
        };
        Relationships: [];
      };
      FAQ: {
        Row: {
          answer: string;
          createdAt: string;
          id: string;
          order: number;
          question: string;
          updatedAt: string;
        };
        Insert: {
          answer: string;
          createdAt?: string;
          id?: string;
          order?: number;
          question: string;
          updatedAt?: string;
        };
        Update: {
          answer?: string;
          createdAt?: string;
          id?: string;
          order?: number;
          question?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      HomePageContent: {
        Row: {
          createdAt: string;
          ctaSubtitle: string;
          ctaTitle: string;
          feature1Description: string;
          feature1Title: string;
          feature2Description: string;
          feature2Title: string;
          feature3Description: string;
          feature3Title: string;
          heroSubtitle: string;
          heroTitle: string;
          id: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          ctaSubtitle?: string;
          ctaTitle?: string;
          feature1Description?: string;
          feature1Title?: string;
          feature2Description?: string;
          feature2Title?: string;
          feature3Description?: string;
          feature3Title?: string;
          heroSubtitle?: string;
          heroTitle?: string;
          id?: string;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          ctaSubtitle?: string;
          ctaTitle?: string;
          feature1Description?: string;
          feature1Title?: string;
          feature2Description?: string;
          feature2Title?: string;
          feature3Description?: string;
          feature3Title?: string;
          heroSubtitle?: string;
          heroTitle?: string;
          id?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      TestDriveBooking: {
        Row: {
          bookingDate: string;
          carId: string;
          createdAt: string;
          endTime: string;
          id: string;
          notes: string | null;
          startTime: string;
          status: Database["public"]["Enums"]["BookingStatus"];
          updatedAt: string;
          userId: string;
        };
        Insert: {
          bookingDate: string;
          carId: string;
          createdAt?: string;
          endTime: string;
          id?: string;
          notes?: string | null;
          startTime: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          updatedAt: string;
          userId: string;
        };
        Update: {
          bookingDate?: string;
          carId?: string;
          createdAt?: string;
          endTime?: string;
          id?: string;
          notes?: string | null;
          startTime?: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          updatedAt?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "TestDriveBooking_carId_fkey";
            columns: ["carId"];
            isOneToOne: false;
            referencedRelation: "Car";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "TestDriveBooking_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "User";
            referencedColumns: ["id"];
          },
        ];
      };
      User: {
        Row: {
          createdAt: string;
          email: string;
          id: string;
          imageUrl: string | null;
          name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["UserRole"];
          supabaseAuthUserId: string | null;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          email: string;
          id?: string;
          imageUrl?: string | null;
          name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          supabaseAuthUserId?: string | null;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          email?: string;
          id?: string;
          imageUrl?: string | null;
          name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          supabaseAuthUserId?: string | null;
          updatedAt?: string;
        };
        Relationships: [];
      };
      UserSavedCar: {
        Row: {
          carId: string;
          id: string;
          savedAt: string;
          userId: string;
        };
        Insert: {
          carId: string;
          id?: string;
          savedAt?: string;
          userId: string;
        };
        Update: {
          carId?: string;
          id?: string;
          savedAt?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "UserSavedCar_carId_fkey";
            columns: ["carId"];
            isOneToOne: false;
            referencedRelation: "Car";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "UserSavedCar_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "User";
            referencedColumns: ["id"];
          },
        ];
      };
      WorkingHour: {
        Row: {
          closeTime: string;
          createdAt: string;
          dayOfWeek: Database["public"]["Enums"]["DayOfWeek"];
          dealershipId: string;
          id: string;
          isOpen: boolean;
          openTime: string;
          updatedAt: string;
        };
        Insert: {
          closeTime: string;
          createdAt?: string;
          dayOfWeek: Database["public"]["Enums"]["DayOfWeek"];
          dealershipId: string;
          id?: string;
          isOpen?: boolean;
          openTime: string;
          updatedAt: string;
        };
        Update: {
          closeTime?: string;
          createdAt?: string;
          dayOfWeek?: Database["public"]["Enums"]["DayOfWeek"];
          dealershipId?: string;
          id?: string;
          isOpen?: boolean;
          openTime?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "WorkingHour_dealershipId_fkey";
            columns: ["dealershipId"];
            isOneToOne: false;
            referencedRelation: "DealershipInfo";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_global_storage_usage: { Args: never; Returns: number };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      BookingStatus:
        | "PENDING"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW";
      CarStatus: "AVAILABLE" | "UNAVAILABLE" | "SOLD";
      DayOfWeek:
        | "MONDAY"
        | "TUESDAY"
        | "WEDNESDAY"
        | "THURSDAY"
        | "FRIDAY"
        | "SATURDAY"
        | "SUNDAY";
      UserRole: "USER" | "ADMIN";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      BookingStatus: [
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      CarStatus: ["AVAILABLE", "UNAVAILABLE", "SOLD"],
      DayOfWeek: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      UserRole: ["USER", "ADMIN"],
    },
  },
} as const;
