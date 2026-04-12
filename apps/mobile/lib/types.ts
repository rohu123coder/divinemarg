export type AstrologerListItem = {
  id: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  total_reviews: number;
  price_per_minute: number | null;
  is_available: boolean;
  experience_years: number | null;
  name: string;
  avatar_url: string | null;
};

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: "user" | "astrologer";
  content: string;
  createdAt: string;
};
