// APIから返されるデータの型定義
export interface ServiceItem {
  departureStore: { store: string; branch: string; small: string };
  returnStore: string;
  carType: { carModel: string; number: string };
  carCondition: string;
  departurePeriod: { start: string; end: string };
  reservationPhone: { shop: string; tel: string };
}

// APIレスポンス全体の型定義
export interface ApiResponse {
  serviceItems?: ServiceItem[];
  message?: string;
}
