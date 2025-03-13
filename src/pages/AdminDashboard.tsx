import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllDepartments } from "@/services/api";
import { Department, Queue } from "@/lib/types";
import QueueManagement from "@/components/staff/QueueManagement";
import { toast } from "sonner";
import QueueStats from "@/components/staff/QueueStats";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const AdminDashboard = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unchecked' | 'success' | 'error'>('unchecked');
  const [testLoading, setTestLoading] = useState(false);
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

  const testDatabaseConnection = async () => {
    setTestLoading(true);
    try {
      // 1. ทดสอบการเชื่อมต่อฐานข้อมูล
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .limit(3);
      
      if (deptError) throw deptError;
      
      // 2. ทดสอบการเชื่อมต่อกับตารางคิว
      const { data: queueData, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .limit(3);
      
      if (queueError) throw queueError;
      
      // 3. ทดสอบการนับจำนวนคิวตามสถานะ - Using correct Supabase query syntax
      const { data: queueStats, error: statsError } = await supabase
        .from('queues')
        .select('status, count(*)')
        .group('status');
      
      if (statsError) throw statsError;
      
      setConnectionStatus('success');
      toast.success("เชื่อมต่อกับฐานข้อมูลและทดสอบการจัดการคิวสำเร็จ");
      console.log("Connection test results:");
      console.log("- Departments:", deptData);
      console.log("- Queues:", queueData);
      console.log("- Queue Stats:", queueStats);
      
    } catch (error) {
      console.error("Database connection error:", error);
      setConnectionStatus('error');
      toast.error("เชื่อมต่อกับฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      setTestLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    navigate("/admin-login");
    toast.success("ออกจากระบบแล้ว");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-hospital-700">แผงควบคุมผู้ดูแลระบบ (ทดสอบ)</h1>
        <Button variant="outline" onClick={handleLogout}>ออกจากระบบ</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ทดสอบการเชื่อมต่อฐานข้อมูลและการจัดการคิว</CardTitle>
          <CardDescription>ทดสอบการเชื่อมต่อและการดึงข้อมูลจากฐานข้อมูล Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testDatabaseConnection} 
            variant="outline" 
            className="w-full mb-4"
            disabled={testLoading}
          >
            {testLoading ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อฐานข้อมูลและการจัดการคิว'}
          </Button>
          
          {connectionStatus !== 'unchecked' && (
            <Alert className={connectionStatus === 'success' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              {connectionStatus === 'success' ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <XCircle className="h-4 w-4 text-red-600" />
              }
              <AlertTitle className={connectionStatus === 'success' ? "text-green-800" : "text-red-800"}>
                {connectionStatus === 'success' ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อไม่สำเร็จ'}
              </AlertTitle>
              <AlertDescription className={connectionStatus === 'success' ? "text-green-700" : "text-red-700"}>
                {connectionStatus === 'success' 
                  ? 'การเชื่อมต่อกับฐานข้อมูล Supabase และการจัดการคิวทำงานได้ตามปกติ' 
                  : 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล Supabase หรือทดสอบการจัดการคิวได้ กรุณาตรวจสอบการเชื่อมต่อ'
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
            <TabsList className="mb-4 flex flex-wrap">
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
