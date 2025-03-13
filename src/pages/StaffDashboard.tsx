// นำเข้าไลบรารีและคอมโพเนนต์ที่จำเป็น
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

// คอมโพเนนต์หลักสำหรับหน้าแดชบอร์ดของเจ้าหน้าที่
const StaffDashboard = () => {
  const [staff, setStaff] = useState<Staff | null>(null); // ข้อมูลเจ้าหน้าที่
  const [department, setDepartment] = useState<Department | null>(null); // ข้อมูลแผนก
  const navigate = useNavigate(); // สำหรับการเปลี่ยนเส้นทาง

  // ตรวจสอบการยืนยันตัวตนและดึงข้อมูลเจ้าหน้าที่และแผนกเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login"); // หากไม่มีผู้ใช้ นำทางไปหน้าเข้าสู่ระบบ
        return;
      }

      const profile = await getCurrentProfile();
      if (!profile || !profile.staff_id) {
        navigate("/login"); // หากไม่มีข้อมูลโปรไฟล์หรือไม่มี staff_id นำทางไปหน้าเข้าสู่ระบบ
        return;
      }

      const staffDetails = await getStaffDetails(profile.staff_id);
      setStaff(staffDetails); // ตั้งค่าข้อมูลเจ้าหน้าที่

      if (staffDetails?.department_id) {
        try {
          const dept = await fetchDepartmentById(staffDetails.department_id);
          setDepartment(dept); // ตั้งค่าข้อมูลแผนก
        } catch (error) {
          console.error("Error fetching department:", error);
          toast.error("ไม่สามารถโหลดข้อมูลแผนกได้"); // แจ้งเตือนหากโหลดข้อมูลแผนกไม่สำเร็จ
        }
      }
    };

    checkAuth();
  }, [navigate]);

  // หากยังไม่มีข้อมูลเจ้าหน้าที่ แสดงสถานะกำลังโหลด
  if (!staff) {
    return <LoadingState />;
  }

  // แสดงหน้าแดชบอร์ด
  return (
    <div className="container mx-auto py-6">
      <StaffHeader staff={staff} department={department} /> {/* ส่วนหัวของหน้าเจ้าหน้าที่ */}
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">สถิติคิว</h2> {/* หัวข้อสถิติคิว */}
        <QueueStats departmentId={staff.department_id} /> {/* คอมโพเนนต์แสดงสถิติคิว */}
      </div>
      
      {staff.department_id ? ( // หากเจ้าหน้าที่สังกัดแผนก
        <Card className="border-hospital-100">
          <CardHeader className="bg-hospital-50">
            <CardTitle className="text-xl text-hospital-700">
              การจัดการคิว
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <QueueManagement departmentId={staff.department_id} /> {/* คอมโพเนนต์จัดการคิว */}
          </CardContent>
        </Card>
      ) : ( // หากเจ้าหน้าที่ยังไม่ถูกกำหนดแผนก
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
