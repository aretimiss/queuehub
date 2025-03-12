
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getCurrentProfile, getStaffDetails } from "@/services/auth";
import { Staff, Department } from "@/lib/types";
import { toast } from "sonner";
import QueueStats from "@/components/staff/QueueStats";
import QueueManagement from "@/components/staff/QueueManagement";
import StaffHeader from "@/components/staff/StaffHeader";
import LoadingState from "@/components/staff/LoadingState";
import { fetchDepartmentById } from "@/services/department";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // ถ้ายังไม่มีข้อมูลเจ้าหน้าที่
  if (!staff) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto py-6">
      <StaffHeader staff={staff} department={department} />
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">สถิติคิว</h2>
        <QueueStats departmentId={staff.department_id} />
      </div>
      
      {staff.department_id ? (
        <Card className="border-hospital-100">
          <CardHeader className="bg-hospital-50">
            <CardTitle className="text-xl text-hospital-700">
              การจัดการคิว
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <QueueManagement departmentId={staff.department_id} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              คุณยังไม่ได้ถูกกำหนดแผนก กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffDashboard;
