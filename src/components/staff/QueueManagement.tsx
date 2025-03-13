import { useState, useEffect, useMemo } from "react"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Queue } from "@/lib/types";
import QueueList from "./QueueList";
import { fetchQueuesByDepartment, updateQueueStatus } from "@/services/api";

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

  const { data: queues = [], refetch } = useQuery({
    queryKey: ['queues', departmentId],
    queryFn: () => fetchQueuesByDepartment(departmentId),
    enabled: !!departmentId
  });

  const updateQueueMutation = useMutation({
    mutationFn: ({ queueId, status }: { queueId: string, status: string }) =>
      updateQueueStatus(queueId, status),
    onMutate: async ({ queueId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['queues', departmentId] });
      const previousQueues = queryClient.getQueryData(['queues', departmentId]);

      queryClient.setQueryData(['queues', departmentId], (old: Queue[] | undefined) => {
        return old?.map(queue => {
          if (queue.id === queueId) {
            return { ...queue, status };
          }
          return queue;
        });
      });

      return { previousQueues };
    },
    onError: (err, newQueue, context) => {
      queryClient.setQueryData(['queues', departmentId], context?.previousQueues);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะคิว");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queues', departmentId] });
      refetch();
    },
    onSuccess: () => {
      toast.success("อัปเดตสถานะคิวเรียบร้อย");
    }
  });

  const handleStatusUpdate = (queue: Queue, status: string) => {
    updateQueueMutation.mutate({ queueId: queue.id, status });
  };

  useEffect(() => {
    const newFilteredQueues = {
      waiting: queues.filter(q => q.status === 'waiting'),
      serving: queues.filter(q => q.status === 'serving'),
      called: queues.filter(q => q.status === 'called'),
      completed: queues.filter(q => q.status === 'completed'),
      cancelled: queues.filter(q => q.status === 'cancelled'),
    };

    if (JSON.stringify(newFilteredQueues) !== JSON.stringify(filteredQueues)) {
      setFilteredQueues(newFilteredQueues);
    }
  }, [queues, departmentId, filteredQueues]);

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
