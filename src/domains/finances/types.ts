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
  goals?: {
    id: string;
    title: string;
    amount: number;
    quotaPerPlayer?: number;
    status: "active" | "completed";
    contributions: Record<string, number>;
    createdAt?: string;
  }[];
  perms: Permissions;
}
