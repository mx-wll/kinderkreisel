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

export type Category = "clothes" | "other";

export const CLOTHING_SIZES = [
  "50", "56", "62", "68", "74", "80", "86", "92", "98",
  "104", "110", "116", "122", "128", "134", "140", "146",
  "152", "158", "164", "170", "176",
] as const;

export type Item = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  pricing_type: PricingType;
  pricing_detail: string | null;
  category: Category;
  size: string | null;
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

export type ItemWithSellerDetail = Item & {
  seller: Pick<Profile, "id" | "name" | "avatar_url" | "phone">;
};

export type ItemWithSellerAndReservation = ItemWithSellerDetail & {
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

// Chat types

export type Conversation = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type ConversationWithDetails = Conversation & {
  item: Pick<Item, "id" | "title" | "image_url">;
  other_user: Pick<Profile, "id" | "name" | "avatar_url">;
  last_message: Pick<Message, "content" | "created_at" | "sender_id"> | null;
  unread_count: number;
};

export type MessageWithSender = Message & {
  sender: Pick<Profile, "id" | "name" | "avatar_url">;
};
