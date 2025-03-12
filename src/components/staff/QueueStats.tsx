
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, BellRing, CheckCircle, XCircle } from "lucide-react";
import { Queue } from "@/lib/types";

interface QueueStatsProps {
  departmentId: string | null;
}

const QueueStats = ({ departmentId }: QueueStatsProps) => {
  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['queues', departmentId],
    queryFn: () => departmentId ? fetchQueuesByDepartment(departmentId) : Promise.resolve([]),
    enabled: !!departmentId
  });

  const waitingQueues = queues.filter(q => q.status === 'waiting');
  const calledQueues = queues.filter(q => q.status === 'called');
  const completedQueues = queues.filter(q => q.status === 'completed');
  const cancelledQueues = queues.filter(q => q.status === 'cancelled');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="h-16 animate-pulse bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
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

export default QueueStats;
