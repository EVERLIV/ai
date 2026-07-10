export const SALE_DEAL_TYPE = "Продажа";
export const RENT_DEAL_TYPE = "Аренда";

export function isSaleDeal(dealType: string | null | undefined): boolean {
  return dealType === SALE_DEAL_TYPE;
}

export function isRentDeal(dealType: string | null | undefined): boolean {
  return dealType === RENT_DEAL_TYPE;
}
