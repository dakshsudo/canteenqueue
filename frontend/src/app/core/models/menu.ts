export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: string | number;
  image_url?: string | null;
  is_veg: number;
  prep_time_minutes: number;
  is_available: number;
  is_active: number;
  category_name?: string;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  is_active?: number;
  items?: MenuItem[];
}
