
import { useState, useEffect } from "react"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Queue } from "@/lib/types";
import QueueList from "./QueueList";
import { supabase } from "@/integrations/supabase/client";

interface QueueManagementProps {
  departmentId: string;
}

const QueueManagement = ({ departmentId }: QueueManagementProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("waiting");
  const [filteredQueues, setFilteredQueues] = useState<{
    waiting: Queue[];
    serving: Queue[];
    called: Queue[];
    completed: Queue[];
    cancelled: Queue[];
  }>({
    waiting: [],
    serving: [],
    called: [],
    completed: [],
    cancelled: [],
  });

  // ดึงข้อมูลคิวทั้งหมดสำหรับแผนก
  const { data: queues = [], refetch, isLoading } = useQuery({
    queryKey: ['queues', departmentId],
    queryFn: async () => {
      try {
        console.log('กำลังดึงข้อมูลคิวสำหรับแผนก:', departmentId);
        
        const { data, error } = await supabase
          .from('queues')
          .select(`
            *,
            patient:patient_id (*)
          `)
          .eq('department_id', departmentId)
          .order('created_at');
        
        if (error) {
          console.error("เกิดข้อผิดพลาดในการดึงข้อมูลคิว:", error);
          toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลคิว");
          return [];
        }
        
        console.log(`ดึงข้อมูลคิวได้ ${data?.length || 0} รายการ`);
        return data as Queue[] || [];
      } catch (error) {
        console.error("เกิดข้อผิดพลาดที่ไม่คาดคิด:", error);
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลคิว");
        return [];
      }
    },
    enabled: !!departmentId,
    refetchInterval: 5000, // รีเฟรชข้อมูลทุก 5 วินาที
  });

  // อัพเดทการกรองคิวเมื่อข้อมูลคิวเปลี่ยนแปลง
  useEffect(() => {
    if (!queues) return;
    
    // กรองคิวตามสถานะ
    const newFilteredQueues = {
      waiting: queues.filter(q => q.status === 'waiting'),
      serving: queues.filter(q => q.status === 'serving'),
      called: queues.filter(q => q.status === 'called'),
      completed: queues.filter(q => q.status === 'completed'),
      cancelled: queues.filter(q => q.status === 'cancelled'),
    };
    
    setFilteredQueues(newFilteredQueues);
  }, [queues]);

  // ฟังก์ชันสำหรับอัพเดทสถานะคิว
  const updateQueueMutation = useMutation({
    mutationFn: async ({ queueId, status }: { queueId: string, status: string }) => {
      console.log(`กำลังอัพเดทคิว ${queueId} เป็นสถานะ ${status}`);
      
      try {
        // อัพเดทสถานะคิว
        const { data, error } = await supabase
          .from('queues')
          .update({ 
            status, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', queueId)
          .select()
          .maybeSingle();
        
        if (error) {
          console.error("เกิดข้อผิดพลาดในการอัพเดทคิว:", error);
          throw error;
        }
        
        if (!data) {
          console.error("ไม่พบข้อมูลคิวหลังจากอัพเดท");
          throw new Error("ไม่พบคิวหรือไม่สามารถอัพเดทได้");
        }
        
        console.log("อัพเดทคิวสำเร็จ:", data);
        return data as Queue;
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอัพเดทคิว:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`อัพเดทสถานะคิวหมายเลข ${data.queue_number} เรียบร้อย`);
      
      // รีเซ็ตแคชและรีเฟรชข้อมูลใหม่
      queryClient.invalidateQueries({ queryKey: ['queues', departmentId] });
      refetch();
    },
    onError: (error) => {
      console.error("เกิดข้อผิดพลาดในการอัพเดทสถานะคิว:", error);
      toast.error("เกิดข้อผิดพลาดในการอัพเดทสถานะคิว");
    }
  });

  const handleStatusUpdate = (queue: Queue, status: string) => {
    console.log(`กำลังเปลี่ยนสถานะคิว ${queue.id} เป็น ${status}`);
    updateQueueMutation.mutate({ queueId: queue.id, status });
  };

  if (isLoading) {
    return <div className="py-4 text-center">กำลังโหลดข้อมูลคิว...</div>;
  }

  return (
    <Tabs defaultValue="waiting" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="waiting">รอเรียก ({filteredQueues.waiting.length})</TabsTrigger>
        <TabsTrigger value="serving">กำลังให้บริการ ({filteredQueues.serving.length})</TabsTrigger>
        <TabsTrigger value="called">เรียกแล้ว ({filteredQueues.called.length})</TabsTrigger>
        <TabsTrigger value="completed">เสร็จสิ้น ({filteredQueues.completed.length})</TabsTrigger>
        <TabsTrigger value="cancelled">ยกเลิก ({filteredQueues.cancelled.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="waiting">
        <QueueList
          queues={filteredQueues.waiting}
          onStatusUpdate={handleStatusUpdate}
          showActions={true}
          callButton={true}
          startServiceButton={true}
          cancelButton={true}
        />
      </TabsContent>

      <TabsContent value="serving">
        <QueueList
          queues={filteredQueues.serving}
          onStatusUpdate={handleStatusUpdate}
          showActions={true}
          cancelButton={true}
          completeButton={true}
        />
      </TabsContent>

      <TabsContent value="called">
        <QueueList
          queues={filteredQueues.called}
          onStatusUpdate={handleStatusUpdate}
          showActions={true}
          startServiceButton={true}
          completeButton={true}
          cancelButton={true}
        />
      </TabsContent>

      <TabsContent value="completed">
        <QueueList
          queues={filteredQueues.completed}
          onStatusUpdate={handleStatusUpdate}
          showActions={false}
        />
      </TabsContent>

      <TabsContent value="cancelled">
        <QueueList
          queues={filteredQueues.cancelled}
          onStatusUpdate={handleStatusUpdate}
          showActions={false}
        />
      </TabsContent>
    </Tabs>
  );
};

export default QueueManagement;
