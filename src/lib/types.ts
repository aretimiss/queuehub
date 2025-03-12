
export interface Department {
  id: string;
  name: string;
  code: string;
  current_queue: string | null;
  total_waiting: number;
  created_at: string;
}

export interface Patient {
  id: string;
  id_card: string;
  name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Queue {
  id: string;
  queue_number: string;
  patient_id: string;
  department_id: string;
  // Update the status type to include string for compatibility with Supabase
  status: 'waiting' | 'called' | 'completed' | 'cancelled' | string;
  created_at: string;
  updated_at: string;
  // Add optional departments field for joined queries
  departments?: Department;
}
