
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
  status: 'waiting' | 'called' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}
