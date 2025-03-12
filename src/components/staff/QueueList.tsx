
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BellRing, CheckCircle, XCircle } from "lucide-react";
import { Queue } from "@/lib/types";

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

export default QueueList;
