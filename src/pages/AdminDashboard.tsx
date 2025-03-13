import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllDepartments } from "@/services/api";
import { Department } from "@/lib/types";
import QueueManagement from "@/components/staff/QueueManagement";
import { toast } from "sonner";
import QueueStats from "@/components/staff/QueueStats";

const AdminDashboard = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const navigate = useNavigate();

  // ตรวจสอบว่าได้ล็อกอินหรือไม่
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin-login");
    }
  }, [navigate]);

  // โหลดข้อมูลแผนก
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deps = await fetchAllDepartments();
        setDepartments(deps);
        if (deps.length > 0) {
          setSelectedDepartment(deps[0].id);
        }
      } catch (error) {
        console.error("Error loading departments:", error);
        toast.error("ไม่สามารถโหลดข้อมูลแผนกได้");
      }
    };
    
    loadDepartments();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    navigate("/admin-login");
    toast.success("ออกจากระบบแล้ว");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-hospital-700">แผงควบคุมผู้ดูแลระบบ (ทดสอบ)</h1>
        <Button variant="outline" onClick={handleLogout}>ออกจากระบบ</Button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">สถิติคิว</h2>
        {selectedDepartment && <QueueStats departmentId={selectedDepartment} />}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>การจัดการคิว</CardTitle>
          <CardDescription>เลือกแผนกเพื่อจัดการคิว</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDepartment || ""} onValueChange={setSelectedDepartment}>
            <TabsList className="mb-4">
              {departments.map(dept => (
                <TabsTrigger key={dept.id} value={dept.id}>
                  {dept.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {departments.map(dept => (
              <TabsContent key={dept.id} value={dept.id}>
                <div className="p-4 bg-hospital-50 mb-4 rounded">
                  <h3 className="font-semibold">รหัสแผนก: {dept.code}</h3>
                  <p className="text-sm text-gray-600">คิวที่กำลังให้บริการ: {dept.current_queue || 'ไม่มี'}</p>
                  <p className="text-sm text-gray-600">จำนวนคิวที่รอ: {dept.total_waiting || 0}</p>
                </div>
                
                {selectedDepartment && (
                  <QueueManagement departmentId={selectedDepartment} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
