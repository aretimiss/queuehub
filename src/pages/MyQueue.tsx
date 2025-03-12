
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

const MyQueue = () => {
  // This would normally come from an API
  const queueInfo = {
    queueNumber: "A123",
    department: "แผนกทั่วไป",
    currentQueue: "A120",
    estimatedWaitTime: "15 นาที",
    queuesBefore: 3,
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>คิวของคุณ</span>
            <Bell className="h-5 w-5 text-hospital-600" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="text-6xl font-bold text-hospital-600">{queueInfo.queueNumber}</div>
            <div className="text-sm text-muted-foreground mt-2">{queueInfo.department}</div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">คิวปัจจุบัน</span>
              <span className="font-medium">{queueInfo.currentQueue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">จำนวนคิวก่อนหน้า</span>
              <span className="font-medium">{queueInfo.queuesBefore} คิว</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">เวลารอโดยประมาณ</span>
              <span className="font-medium">{queueInfo.estimatedWaitTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center text-sm text-muted-foreground">
        เราจะแจ้งเตือนเมื่อใกล้ถึงคิวของคุณ
      </div>
    </div>
  );
};

export default MyQueue;
