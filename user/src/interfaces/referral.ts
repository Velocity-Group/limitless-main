export interface IReferral {
  _id: string;
  referralSource: string;
}

export interface IReferralStats {
  totalRegisters: number;
  totalNetPrice: number;
  totalSales: number;
}
