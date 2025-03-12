
import { Department } from "@/lib/types";
import { toast } from "sonner";

export const fetchDepartmentById = async (departmentId: string): Promise<Department> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .single();

    if (error) {
      console.error("Error fetching department:", error.message);
      toast.error("ไม่สามารถดึงข้อมูลแผนกได้");
      throw error;
    }

    if (!data) {
      const notFoundError = new Error("ไม่พบข้อมูลแผนก");
      console.error(notFoundError);
      toast.error("ไม่พบข้อมูลแผนก");
      throw notFoundError;
    }

    return data as Department;
  } catch (error) {
    console.error("Error fetching department:", error);
    throw error;
  }
};
