import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchQueuesByDepartment } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Queue } from "@/lib/types";

interface QueueStatsProps {
  departmentId: string;
}

const QueueStats = ({ departmentId }: QueueStatsProps) => {
  const {
    data: queues = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["queues", departmentId],
    queryFn: () => fetchQueuesByDepartment(departmentId),
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const waitingQueues = queues.filter((q) => q.status === "waiting").length;
  const servingQueues = queues.filter((q) => q.status === "serving").length;
  const calledQueues = queues.filter((q) => q.status === "called").length;
  const completedQueues = queues.filter((q) => q.status === "completed").length;
  const cancelledQueues = queues.filter((q) => q.status === "cancelled").length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-10 w-10 text-hospital-600 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center">
        <p className="text-red-500">ไม่สามารถโหลดข้อมูลคิวได้</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="border-hospital-100">
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {waitingQueues}
          </div>
          <div className="text-sm text-muted-foreground mt-2">รอเรียก</div>
        </CardContent>
      </Card>
      <Card className="border-hospital-100">
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {calledQueues + servingQueues}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            เรียกแล้ว/กำลังให้บริการ
          </div>
        </CardContent>
      </Card>
      <Card className="border-hospital-100">
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {completedQueues}
          </div>
          <div className="text-sm text-muted-foreground mt-2">เสร็จสิ้น</div>
        </CardContent>
      </Card>
      <Card className="border-hospital-100">
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {cancelledQueues}
          </div>
          <div className="text-sm text-muted-foreground mt-2">ยกเลิก</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueStats;
