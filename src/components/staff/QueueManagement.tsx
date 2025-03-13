
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

  // Use direct Supabase query to fetch all queues for the department
  const { data: queues = [], refetch, isLoading } = useQuery({
    queryKey: ['queues', departmentId],
    queryFn: async () => {
      console.log('Fetching queues for department:', departmentId);
      const { data, error } = await supabase
        .from('queues')
        .select(`
          *,
          patient:patient_id (*)
        `)
        .eq('department_id', departmentId)
        .order('created_at');
      
      if (error) {
        console.error("Error fetching queues:", error);
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลคิว");
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} queues`);
      return data as Queue[] || [];
    },
    enabled: !!departmentId,
    refetchInterval: 30000, // Refetch every 30 seconds as a backup
  });

  // Set up real-time subscription for queue updates
  useEffect(() => {
    if (!departmentId) return;
    
    console.log('Setting up Supabase real-time subscription for queues');
    
    // Subscribe to ALL queue changes for this department
    const channel = supabase
      .channel('queue_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queues',
        filter: `department_id=eq.${departmentId}`
      }, (payload) => {
        console.log('Queue update received via real-time:', payload);
        refetch();
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });
      
    return () => {
      console.log('Unsubscribing from real-time updates');
      supabase.removeChannel(channel);
    };
  }, [departmentId, refetch]);

  // Update queue status using useMutation and fetch fresh data after update
  const updateQueueMutation = useMutation({
    mutationFn: async ({ queueId, status }: { queueId: string, status: string }) => {
      console.log(`Updating queue ${queueId} to status ${status}`);
      
      // Update the queue status
      const { data, error } = await supabase
        .from('queues')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', queueId)
        .select()
        .maybeSingle();
      
      if (error) {
        console.error("Error updating queue:", error);
        throw error;
      }
      
      if (!data) {
        console.error("No queue data returned after update");
        throw new Error("Queue not found or could not be updated");
      }
      
      console.log("Queue updated successfully:", data);
      return data as Queue;
    },
    onSuccess: (data) => {
      toast.success(`อัปเดตสถานะคิวหมายเลข ${data.queue_number} เรียบร้อย`);
      
      // Force invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['queues', departmentId] });
      
      // Force refetch to get the latest data
      refetch();
    },
    onError: (error) => {
      console.error("Error in updateQueueStatus:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะคิว");
    }
  });

  const handleStatusUpdate = (queue: Queue, status: string) => {
    console.log(`Handling status update for queue ${queue.id} to ${status}`);
    updateQueueMutation.mutate({ queueId: queue.id, status });
  };

  // Update filtered queues when queue data changes
  useEffect(() => {
    if (!queues) return;
    
    console.log(`Filtering ${queues.length} queues based on status`);
    
    const newFilteredQueues = {
      waiting: queues.filter(q => q.status === 'waiting'),
      serving: queues.filter(q => q.status === 'serving'),
      called: queues.filter(q => q.status === 'called'),
      completed: queues.filter(q => q.status === 'completed'),
      cancelled: queues.filter(q => q.status === 'cancelled'),
    };
    
    setFilteredQueues(newFilteredQueues);
  }, [queues]);

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
