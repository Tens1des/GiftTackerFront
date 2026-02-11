export interface Wishlist {
  id: string;
  slug: string;
  edit_token: string;
  title: string;
  occasion: string | null;
  owner_name: string | null;
  created_at: string;
  owner_id?: string;
  deadline_at?: string | null;
  items?: WishlistItem[];
}

export interface ItemComment {
  id: string;
  item_id: string;
  body: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  price: number | null;
  target_amount: number | null;
  is_unavailable: boolean;
  sort_order: number;
  created_at: string;
  reserved?: boolean;
  reserved_by?: string;
  total_contributed_cents?: number;
  target_cents?: number;
  comments?: ItemComment[];
}

export interface Reservation {
  id: string;
  item_id: string;
  reserved_by_nickname: string;
  reserved_at: string;
}

export interface Contribution {
  id: string;
  item_id: string;
  amount: number;
  contributed_by_nickname: string;
  contributed_at: string;
}

export type ViewMode = 'owner' | 'guest';
