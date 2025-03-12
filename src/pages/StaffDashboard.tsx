
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getCurrentProfile, getStaffDetails } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { Staff, Department } from "@/lib/types";
import { toast } from "sonner";
import { logoutUser } from "@/services/auth";
import QueueStats from "@/components/staff/QueueStats";
import QueueManagement from "@/components/staff/QueueManagement";

const StaffDashboard = () => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const profile = await getCurrentProfile();
      if (!profile || !profile.staff_id) {
        navigate("/login");
        return;
      }

      const staffDetails = await getStaffDetails(profile.staff_id);
      setStaff(staffDetails);

      if (staffDetails?.department_id) {
        try {
          const dept = await fetchDepartmentById(staffDetails.department_id);
          setDepartment(dept);
        } catch (error) {
          console.error("Error fetching department:", error);
          toast.error("ไม่สามารถโหลดข้อมูลแผนกได้");
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
      toast.success("ออกจากระบบเรียบร้อย");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  // ถ้ายังไม่มีข้อมูลเจ้าหน้าที่
  if (!staff) {
    return (
      <div className="max-w-md mx-auto text-center pt-10">
        <Card>
          <CardContent className="pt-6">
            <p>กรุณาเข้าสู่ระบบอีกครั้ง</p>
            <Button onClick={() => navigate("/login")} className="mt-4">
              ไปยังหน้าเข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">แผงควบคุมเจ้าหน้าที่</h1>
          {staff && <p className="text-gray-500">ยินดีต้อนรับ, {staff.name}</p>}
          {department && <p className="text-hospital-600 font-semibold">แผนก: {department.name}</p>}
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          ออกจากระบบ
        </Button>
      </div>

      <QueueStats departmentId={staff.department_id} />
      
      {staff.department_id && (
        <QueueManagement departmentId={staff.department_id} />
      )}
    </div>
  );
};

// ฟังก์ชันดึงข้อมูลแผนก
const fetchDepartmentById = async (departmentId: string): Promise<Department> => {
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

export default StaffDashboard;
