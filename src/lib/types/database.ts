export type Profile = {
  id: string;
  name: string;
  surname: string;
  residency: string;
  zip_code: string;
  phone: string;
  avatar_url: string | null;
  phone_consent: boolean;
  email_notifications: boolean;
  last_message_email_at: string;
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

export type Category = "clothing" | "shoes" | "toys" | "outdoor_sports" | "other";

export const CATEGORIES: { slug: Category; label: string }[] = [
  { slug: "clothing", label: "Kleidung" },
  { slug: "shoes", label: "Schuhe" },
  { slug: "toys", label: "Spielzeug" },
  { slug: "outdoor_sports", label: "Draußen & Sport" },
  { slug: "other", label: "Sonstiges" },
];

export const CLOTHING_SIZES = [
  "50", "56", "62", "68", "74", "80", "86", "92", "98",
  "104", "110", "116", "122", "128", "134", "140", "146",
  "152", "158", "164", "170", "176",
] as const;

export const CLOTHING_SIZE_LABELS: Record<string, string> = {
  "50": "50 (0–1 Mon.)",
  "56": "56 (0–3 Mon.)",
  "62": "62 (3–6 Mon.)",
  "68": "68 (6–9 Mon.)",
  "74": "74 (9–12 Mon.)",
  "80": "80 (12–18 Mon.)",
  "86": "86 (18–24 Mon.)",
  "92": "92 (ca. 2 J.)",
  "98": "98 (ca. 3 J.)",
  "104": "104 (ca. 4 J.)",
  "110": "110 (ca. 5 J.)",
  "116": "116 (ca. 6 J.)",
  "122": "122 (ca. 7 J.)",
  "128": "128 (ca. 8 J.)",
  "134": "134 (ca. 9 J.)",
  "140": "140 (ca. 10 J.)",
  "146": "146 (ca. 11 J.)",
  "152": "152 (ca. 12 J.)",
  "158": "158 (ca. 13 J.)",
  "164": "164 (ca. 14 J.)",
  "170": "170 (ca. 15 J.)",
  "176": "176 (ca. 16 J.)",
};

export const SHOE_SIZES = [
  "16", "17", "18", "19", "20", "21", "22", "23", "24", "25",
  "26", "27", "28", "29", "30", "31", "32", "33", "34", "35",
  "36", "37", "38", "39", "40",
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
  shoe_size: string | null;
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
