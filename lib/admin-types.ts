export type AdminCategory = { id: number; name: string };

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  category_id: number | null;
  category_name: string | null;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  gender: string;
  status: string;
  is_featured: boolean;
  is_new: boolean;
  image_url: string | null;
  total_stock: number;
};

export type AdminCustomer = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
};

export type AdminOrderItem = {
  id: number;
  product_name: string;
  color_name: string;
  size_name: string;
  unit_price: number;
  quantity: number;
};

export type AdminOrder = {
  id: string;
  code: string;
  user_id: string | null;
  recipient_name: string;
  phone: string;
  email: string;
  shipping_address: string;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: AdminOrderItem[];
};

export type AdminVariant = {
  id: string;
  product_name: string;
  color_name: string;
  size_name: string;
  sku: string;
  price: number;
  stock: number;
};

export type CustomerOption = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
};

type BadgeMeta = { label: string; badgeClass: string };

export const ORDER_STATUSES: Record<string, BadgeMeta> = {
  pending: { label: "Đang xử lý", badgeClass: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Đã xác nhận", badgeClass: "bg-sky-50 text-sky-700" },
  shipping: { label: "Đang giao", badgeClass: "bg-blue-50 text-blue-700" },
  completed: { label: "Đã giao", badgeClass: "bg-green-50 text-green-700" },
  cancelled: { label: "Đã hủy", badgeClass: "bg-red-50 text-red-700" },
};

export const PAYMENT_STATUSES: Record<string, BadgeMeta> = {
  unpaid: { label: "Chưa thanh toán", badgeClass: "bg-amber-50 text-amber-700" },
  paid: { label: "Đã thanh toán", badgeClass: "bg-green-50 text-green-700" },
  refunded: { label: "Đã hoàn tiền", badgeClass: "bg-red-50 text-red-700" },
};

export const PAYMENT_METHODS: Record<string, string> = {
  cod: "COD",
  bank_transfer: "Chuyển khoản",
  ewallet: "Ví điện tử",
};

export const PRODUCT_STATUSES: Record<string, BadgeMeta> = {
  active: { label: "Đang bán", badgeClass: "bg-green-50 text-green-700" },
  draft: { label: "Bản nháp", badgeClass: "bg-neutral-100 text-neutral-600" },
  archived: { label: "Lưu trữ", badgeClass: "bg-neutral-100 text-neutral-500" },
};

export const GENDERS: Record<string, string> = {
  women: "Nữ",
  men: "Nam",
  unisex: "Unisex",
};
