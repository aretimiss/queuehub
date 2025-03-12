
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Queue } from "@/lib/types";
import QueueList from "./QueueList";

interface QueueManagementProps {
  departmentId: string;
}

const QueueManagement = ({ departmentId }: QueueManagementProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("waiting");

  const { data: queues = [] } = useQuery({
    queryKey: ['queues', departmentId],
    queryFn: () => fetchQueuesByDepartment(departmentId),
    enabled: !!departmentId
  });

  const updateQueueMutation = useMutation({
    mutationFn: ({ queueId, status }: { queueId: string, status: string }) => 
      updateQueueStatus(queueId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success("อัพเดตสถานะคิวเรียบร้อย");
    },
    onError: (error) => {
      console.error("Error updating queue:", error);
      toast.error("เกิดข้อผิดพลาดในการอัพเดตสถานะคิว");
    }
  });

  const handleStatusUpdate = (queueId: string, status: string) => {
    updateQueueMutation.mutate({ queueId, status });
  };

  const waitingQueues = queues.filter(q => q.status === 'waiting');
  const calledQueues = queues.filter(q => q.status === 'called');
  const completedQueues = queues.filter(q => q.status === 'completed');
  const cancelledQueues = queues.filter(q => q.status === 'cancelled');

  return (
    <Tabs defaultValue="waiting" value={activeTab} onValueChange={setActiveTab}>
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
  );
};

// ฟังก์ชันดึงข้อมูลคิวตามแผนก
const fetchQueuesByDepartment = async (departmentId: string): Promise<Queue[]> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from('queues')
      .select(`
        *,
        departments:department_id (*),
        patient:patient_id (*)
      `)
      .eq('department_id', departmentId);

    if (error) throw error;
    return data as Queue[];
  } catch (error) {
    console.error("Error fetching queues:", error);
    return [];
  }
};

// ฟังก์ชันอัพเดตสถานะคิว
const updateQueueStatus = async (queueId: string, status: string): Promise<void> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase
      .from('queues')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', queueId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating queue status:", error);
    throw error;
  }
};

export default QueueManagement;
