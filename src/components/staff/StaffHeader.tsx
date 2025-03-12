
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/services/auth";
import { Department, Staff } from "@/lib/types";

interface StaffHeaderProps {
  staff: Staff;
  department: Department | null;
}

const StaffHeader = ({ staff, department }: StaffHeaderProps) => {
  const navigate = useNavigate();

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

  return (
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
  );
};

export default StaffHeader;
