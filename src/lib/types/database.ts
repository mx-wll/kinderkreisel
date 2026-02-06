export type Profile = {
  id: string;
  name: string;
  surname: string;
  residency: string;
  zip_code: string;
  phone: string;
  avatar_url: string | null;
  phone_consent: boolean;
  created_at: string;
  updated_at: string;
};

export type Child = {
  id: string;
  profile_id: string;
  age: number | null;
  gender: string | null;
  created_at: string;
};

export type PricingType = "free" | "lending" | "other";

export type ItemStatus = "available" | "reserved";

export type Item = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  pricing_type: PricingType;
  pricing_detail: string | null;
  image_url: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

export type ReservationStatus = "active" | "expired" | "cancelled";

export type Reservation = {
  id: string;
  item_id: string;
  buyer_id: string;
  status: ReservationStatus;
  created_at: string;
  expires_at: string;
};

// Joined types for common queries
export type ItemWithSeller = Item & {
  seller: Pick<Profile, "id" | "name" | "avatar_url">;
};

export type ItemWithSellerAndReservation = ItemWithSeller & {
  reservation: Reservation | null;
};

export type ProfileWithItemCount = Profile & {
  item_count: number;
};

export type ReservationWithItem = Reservation & {
  item: Item & {
    seller: Pick<Profile, "id" | "name" | "phone" | "avatar_url">;
  };
};
