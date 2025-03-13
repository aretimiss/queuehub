
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BellRing, CheckCircle, XCircle } from "lucide-react";
import { Queue } from "@/lib/types";

interface QueueListProps {
  queues: Queue[];
  onStatusUpdate: (queue: Queue, status: string) => void;
  showActions: boolean;
  callButton?: boolean;
  cancelButton?: boolean;
  completeButton?: boolean;
  serveButton?: boolean;
  startServiceButton?: boolean;
}

const QueueList = ({ 
  queues, 
  onStatusUpdate, 
  showActions = false,
  callButton = false,
  completeButton = false,
  cancelButton = false,
  serveButton = false,
  startServiceButton = false
}: QueueListProps) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">ลำดับคิว</TableHead>
            <TableHead>เลขบัตรประชาชน</TableHead>
            {showActions && <TableHead className="text-right">จัดการ</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {queues.map((queue) => (
            <TableRow key={queue.id}>
              <TableCell className="font-medium">{queue.queue_number}</TableCell>
              <TableCell className="text-sm">{queue.patient?.id_card}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end items-center gap-2">
                    {callButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusUpdate(queue, "called")}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        เรียกคิว
                      </Button>
                    )}
                    {startServiceButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusUpdate(queue, "serving")}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        เข้ารับบริการ
                      </Button>
                    )}
                    {serveButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusUpdate(queue, "serving")}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        เข้ารับบริการ
                      </Button>
                    )}
                    {completeButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusUpdate(queue, "completed")}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        เสร็จสิ้น
                      </Button>
                    )}
                    {cancelButton && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onStatusUpdate(queue, "cancelled")}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        ยกเลิก
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default QueueList;
