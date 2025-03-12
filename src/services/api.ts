
import { supabase } from "@/integrations/supabase/client";
import { Department, Patient, Queue } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

export const fetchAllDepartments = async (): Promise<Department[]> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }

  return data || [];
};

export const fetchAllQueues = async (): Promise<Queue[]> => {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .order('created_at');

  if (error) {
    console.error("Error fetching queues:", error);
    throw error;
  }

  return data || [];
};

export const fetchDepartmentById = async (id: string): Promise<Department | null> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching department:", error);
    return null;
  }

  return data;
};

export const fetchQueuesByPatientIdCard = async (idCard: string): Promise<Queue[]> => {
  // First find the patient
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id_card', idCard)
    .maybeSingle();

  if (patientError || !patient) {
    console.error("Error fetching patient:", patientError);
    return [];
  }

  // Then get their queues
  const { data: queues, error: queuesError } = await supabase
    .from('queues')
    .select(`
      *,
      departments(*)
    `)
    .eq('patient_id', patient.id)
    .eq('status', 'waiting')
    .order('created_at');

  if (queuesError) {
    console.error("Error fetching queues:", queuesError);
    return [];
  }

  return queues || [];
};

export const createQueue = async (idCard: string, departmentId: string): Promise<Queue | null> => {
  try {
    // Check if patient exists
    let patientId;
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('id_card', idCard)
      .maybeSingle();
    
    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      // Create new patient
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({ id_card: idCard })
        .select('id')
        .single();
      
      if (patientError) {
        console.error("Error creating patient:", patientError);
        throw patientError;
      }
      
      patientId = newPatient.id;
    }
    
    // Get department to generate queue number
    const { data: department } = await supabase
      .from('departments')
      .select('code, current_queue')
      .eq('id', departmentId)
      .single();
    
    if (!department) {
      throw new Error("Department not found");
    }
    
    // Generate new queue number
    const prefix = department.code.charAt(0).toUpperCase();
    let number = 1;
    
    if (department.current_queue) {
      const currentNumber = parseInt(department.current_queue.substring(1));
      if (!isNaN(currentNumber)) {
        number = currentNumber + 1;
      }
    }
    
    const queueNumber = `${prefix}${number.toString().padStart(3, '0')}`;
    
    // Create queue
    const { data: newQueue, error: queueError } = await supabase
      .from('queues')
      .insert({
        queue_number: queueNumber,
        patient_id: patientId,
        department_id: departmentId,
        status: 'waiting'
      })
      .select()
      .single();
    
    if (queueError) {
      console.error("Error creating queue:", queueError);
      throw queueError;
    }
    
    // Update department's current queue and total waiting
    await supabase
      .from('departments')
      .update({
        current_queue: queueNumber,
        total_waiting: department.total_waiting ? department.total_waiting + 1 : 1
      })
      .eq('id', departmentId);
    
    return newQueue;
  } catch (error) {
    console.error("Error in createQueue:", error);
    toast.error("เกิดข้อผิดพลาดในการจองคิว กรุณาลองใหม่อีกครั้ง");
    return null;
  }
};
