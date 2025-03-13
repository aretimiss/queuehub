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

interface QueueListProps {
  queues: Queue[];
  onStatusUpdate: (queue: Queue, status: string) => void;
  showActions: boolean;
  callButton?: boolean;
  cancelButton?: boolean;
  completeButton?: boolean;
  serveButton?: boolean;
}

const QueueList = ({
  queues,
  onStatusUpdate,
  showActions,
  callButton,
  cancelButton,
  completeButton,
  serveButton,
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
                  {serveButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusUpdate(queue, "serving")}
                    >
                      เข้ารับบริการ
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
