
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
      <QueueStats departmentId={staff.department_id} />
      
      {staff.department_id && (
        <QueueManagement departmentId={staff.department_id} />
      )}
    </div>
  );
};

export default StaffDashboard;
