
import { Department } from "@/lib/types";

export const fetchDepartmentById = async (departmentId: string): Promise<Department> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .single();

    if (error) throw error;
    return data as Department;
  } catch (error) {
    console.error("Error fetching department:", error);
    throw error;
  }
};
