export interface Transaction {
  id: string;
  type: "ingreso" | "gasto";
  description: string;
  category: string;
  amount: number;
  date: string;
  timestamp?: string;
}

export interface Player {
  id: string;
  name: string;
  amount_paid?: number;
  payment_timestamp?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface Permissions {
  canEditFinanzas: boolean;
  [key: string]: any;
}

export interface FinancesProps {
  transactions: Transaction[];
  players: Player[];
  perms: Permissions;
}
