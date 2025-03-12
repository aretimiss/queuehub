
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, getCurrentProfile, getStaffDetails } from "@/services/auth";
import { fetchQueuesByDepartment, fetchDepartmentById, updateQueueStatus } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Queue, Staff, Department } from "@/lib/types";
import { toast } from "sonner";
import { 
  Users, 
  Clock, 
  BellRing, 
  CheckCircle, 
  XCircle, 
  ArrowRightCircle,
  LogOut
} from "lucide-react";
import { logoutUser } from "@/services/auth";

const StaffDashboard = () => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        const dept = await fetchDepartmentById(staffDetails.department_id);
        setDepartment(dept);
      }
    };

    checkAuth();
  }, [navigate]);

  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['queues', staff?.department_id],
    queryFn: () => staff?.department_id ? fetchQueuesByDepartment(staff.department_id) : Promise.resolve([]),
    enabled: !!staff?.department_id
  });

  const updateQueueMutation = useMutation({
    mutationFn: ({ queueId, status }: { queueId: string, status: string }) => 
      updateQueueStatus(queueId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success("อัพเดตสถานะคิวเรียบร้อย");
    }
  });

  const handleStatusUpdate = (queueId: string, status: string) => {
    updateQueueMutation.mutate({ queueId, status });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const waitingQueues = queues.filter(q => q.status === 'waiting');
  const calledQueues = queues.filter(q => q.status === 'called');
  const completedQueues = queues.filter(q => q.status === 'completed');
  const cancelledQueues = queues.filter(q => q.status === 'cancelled');

  // ถ้ายังไม่มีข้อมูลเจ้าหน้าที่
  if (!staff && !isLoading) {
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">รอเรียก</p>
                <p className="text-2xl font-bold">{waitingQueues.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">กำลังให้บริการ</p>
                <p className="text-2xl font-bold">{calledQueues.length}</p>
              </div>
              <BellRing className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">เสร็จสิ้น</p>
                <p className="text-2xl font-bold">{completedQueues.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">ยกเลิก</p>
                <p className="text-2xl font-bold">{cancelledQueues.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="waiting">
        <TabsList className="mb-4">
          <TabsTrigger value="waiting">รอเรียก ({waitingQueues.length})</TabsTrigger>
          <TabsTrigger value="called">กำลังให้บริการ ({calledQueues.length})</TabsTrigger>
          <TabsTrigger value="completed">เสร็จสิ้น ({completedQueues.length})</TabsTrigger>
          <TabsTrigger value="cancelled">ยกเลิก ({cancelledQueues.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="waiting">
          <QueueList 
            queues={waitingQueues} 
            onStatusUpdate={handleStatusUpdate}
            showActions={true}
            callButton={true}
            cancelButton={true}
          />
        </TabsContent>
        
        <TabsContent value="called">
          <QueueList 
            queues={calledQueues} 
            onStatusUpdate={handleStatusUpdate}
            showActions={true}
            completeButton={true}
            cancelButton={true}
          />
        </TabsContent>
        
        <TabsContent value="completed">
          <QueueList 
            queues={completedQueues} 
            onStatusUpdate={handleStatusUpdate}
            showActions={false}
          />
        </TabsContent>
        
        <TabsContent value="cancelled">
          <QueueList 
            queues={cancelledQueues} 
            onStatusUpdate={handleStatusUpdate}
            showActions={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface QueueListProps {
  queues: Queue[];
  onStatusUpdate: (queueId: string, status: string) => void;
  showActions?: boolean;
  callButton?: boolean;
  completeButton?: boolean;
  cancelButton?: boolean;
}

const QueueList = ({ 
  queues, 
  onStatusUpdate, 
  showActions = false,
  callButton = false,
  completeButton = false,
  cancelButton = false
}: QueueListProps) => {
  if (queues.length === 0) {
    return <p className="text-center py-6 text-gray-500">ไม่มีข้อมูลคิว</p>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">รอเรียก</Badge>;
      case 'called':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">กำลังให้บริการ</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">เสร็จสิ้น</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">ยกเลิก</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {queues.map((queue) => (
        <Card key={queue.id} className="overflow-hidden">
          <div className="bg-hospital-50 p-4 flex justify-between items-center">
            <div className="flex items-center">
              <Avatar className="bg-hospital-100 mr-3">
                <AvatarFallback>{queue.queue_number}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold">{queue.patient?.name || 'ผู้ป่วย'}</h3>
                <p className="text-sm text-gray-500">รหัสบัตร: {queue.patient?.id_card || 'ไม่มีข้อมูล'}</p>
              </div>
            </div>
            <div>
              {getStatusBadge(queue.status)}
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm">
                  <span className="text-gray-500">เลขคิว:</span> {queue.queue_number}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">วันที่:</span> {new Date(queue.created_at).toLocaleString('th-TH')}
                </p>
              </div>
              {showActions && (
                <div className="flex space-x-2">
                  {callButton && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      onClick={() => onStatusUpdate(queue.id, 'called')}
                    >
                      <BellRing className="mr-1 h-4 w-4" />
                      เรียกคิว
                    </Button>
                  )}
                  {completeButton && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => onStatusUpdate(queue.id, 'completed')}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      เสร็จสิ้น
                    </Button>
                  )}
                  {cancelButton && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => onStatusUpdate(queue.id, 'cancelled')}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      ยกเลิก
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StaffDashboard;
