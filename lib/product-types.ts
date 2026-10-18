export const PRODUCT_TYPES = {
  shirt: "Áo",
  pants: "Quần",
  dress: "Váy/Đầm",
  jacket: "Áo khoác",
  skirt: "Chân váy",
  hat: "Nón",
  bag: "Túi đeo",
  wallet: "Ví",
  belt: "Dây nịt",
  socks: "Vớ",
  sandals: "Dép",
  shoes: "Giày",
  gloves: "Găng tay",
  other: "Khác",
} as const;

export type ProductType = keyof typeof PRODUCT_TYPES;
