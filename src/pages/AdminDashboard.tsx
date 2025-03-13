
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
import { CheckCircle, XCircle, AlertCircle, Database, BarChart } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unchecked' | 'success' | 'error'>('unchecked');
  const [testLoading, setTestLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
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

  // โหลด dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!selectedDepartment) return;
      
      try {
        const { data, error } = await supabase
          .from('dashboard_stats')
          .select('*')
          .eq('department_id', selectedDepartment)
          .single();
          
        if (error) throw error;
        setDashboardStats(data);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }
    };
    
    fetchDashboardStats();
    
    // Set up real-time subscription for dashboard stats updates
    const subscription = supabase
      .channel('dashboard_stats_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'dashboard_stats',
        filter: `department_id=eq.${selectedDepartment}`
      }, (payload) => {
        setDashboardStats(payload.new);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [selectedDepartment]);

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
      
      // 3. ทดสอบการเชื่อมต่อกับตาราง dashboard_stats
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .limit(3);
        
      if (statsError) throw statsError;
      
      // Log connection test results to the database
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: 'admin',
          action: 'test_connection',
          resource_type: 'database',
          details: { status: 'success' }
        });
      
      setConnectionStatus('success');
      toast.success("เชื่อมต่อกับฐานข้อมูลและทดสอบการจัดการคิวสำเร็จ");
      console.log("Connection test results:");
      console.log("- Departments:", deptData);
      console.log("- Queues:", queueData);
      console.log("- Dashboard Stats:", statsData);
      
    } catch (error) {
      console.error("Database connection error:", error);
      setConnectionStatus('error');
      toast.error("เชื่อมต่อกับฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
      
      // Log connection failure
      try {
        await supabase
          .from('admin_logs')
          .insert({
            admin_id: 'admin',
            action: 'test_connection',
            resource_type: 'database',
            details: { status: 'error', error: JSON.stringify(error) }
          });
      } catch (logError) {
        console.error("Could not log connection error:", logError);
      }
    } finally {
      setTestLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    navigate("/admin-login");
    toast.success("ออกจากระบบแล้ว");
    
    // Log logout action
    supabase
      .from('admin_logs')
      .insert({
        admin_id: 'admin',
        action: 'logout',
        resource_type: 'session'
      })
      .then(({ error }) => {
        if (error) console.error("Error logging logout:", error);
      });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-hospital-700">แผงควบคุมผู้ดูแลระบบ</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/database-test">
              <Database className="mr-2 h-4 w-4" />
              ทดสอบฐานข้อมูล
            </Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>ออกจากระบบ</Button>
        </div>
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
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <BarChart className="mr-2 h-5 w-5" />
          สถิติคิว
        </h2>
        {selectedDepartment && dashboardStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-hospital-100">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-hospital-600">
                  {dashboardStats.waiting_count}
                </div>
                <div className="text-sm text-muted-foreground mt-2">รอเรียก</div>
              </CardContent>
            </Card>
            <Card className="border-hospital-100">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-hospital-600">
                  {dashboardStats.called_count}
                </div>
                <div className="text-sm text-muted-foreground mt-2">เรียกแล้ว</div>
              </CardContent>
            </Card>
            <Card className="border-hospital-100">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-hospital-600">
                  {dashboardStats.serving_count}
                </div>
                <div className="text-sm text-muted-foreground mt-2">กำลังให้บริการ</div>
              </CardContent>
            </Card>
            <Card className="border-hospital-100">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-hospital-600">
                  {dashboardStats.completed_count}
                </div>
                <div className="text-sm text-muted-foreground mt-2">เสร็จสิ้น</div>
              </CardContent>
            </Card>
            <Card className="border-hospital-100">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-hospital-600">
                  {dashboardStats.cancelled_count}
                </div>
                <div className="text-sm text-muted-foreground mt-2">ยกเลิก</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-4">
            <p>กำลังโหลดข้อมูลสถิติ...</p>
          </div>
        )}
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
                
                {selectedDepartment === dept.id && (
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
