import { Queue } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ลำดับคิว</TableHead>
          <TableHead>เลขบัตรประชาชน</TableHead>
          {showActions && <TableHead className="text-right">จัดการ</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {queues.map((queue) => (
          <TableRow key={queue.id}>
            <TableCell>{queue.queue_number}</TableCell>
            <TableCell>{queue.patient?.id_card}</TableCell>
            {showActions && (
              <TableCell className="text-right">
                <div className="flex justify-end items-center space-x-2">
                  {callButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusUpdate(queue, "called")}
                    >
                      เรียกคิว
                    </Button>
                  )}
                  {completeButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusUpdate(queue, "completed")}
                    >
                      เสร็จสิ้น
                    </Button>
                  )}
                  {cancelButton && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onStatusUpdate(queue, "cancelled")}
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
  );
};

export default QueueList;
