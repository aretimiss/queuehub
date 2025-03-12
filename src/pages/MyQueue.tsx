
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bell, Loader2 } from "lucide-react";
import { fetchQueuesByPatientIdCard } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MyQueue = () => {
  const location = useLocation();
  const [idCard, setIdCard] = useState(location.state?.idCard || "");
  const [searchSubmitted, setSearchSubmitted] = useState(!!location.state?.idCard);

  const { 
    data: queueInfo, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['myQueue', idCard],
    queryFn: () => fetchQueuesByPatientIdCard(idCard),
    enabled: searchSubmitted && idCard.length === 13,
  });

  useEffect(() => {
    if (searchSubmitted && idCard.length === 13) {
      // Subscribe to queue changes
      const channel = supabase
        .channel('queue-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'queues',
            filter: `patient_id=eq.${queueInfo?.[0]?.patient_id}`
          },
          (payload) => {
            console.log('Queue changed:', payload);
            refetch();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [searchSubmitted, idCard, queueInfo, refetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (idCard.length === 13) {
      setSearchSubmitted(true);
    }
  };

  if (!searchSubmitted) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>ค้นหาคิวของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idCardSearch">เลขบัตรประชาชน</Label>
                <Input 
                  id="idCardSearch" 
                  value={idCard} 
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                  maxLength={13}
                />
              </div>
              <Button type="submit" className="w-full">ค้นหา</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-10 w-10 text-hospital-600 animate-spin" />
      </div>
    );
  }

  if (!queueInfo || queueInfo.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>ไม่พบข้อมูลคิว</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-muted-foreground">ไม่พบข้อมูลคิวสำหรับเลขบัตรประชาชนนี้ หรือคิวของคุณได้รับการบริการเรียบร้อยแล้ว</p>
              <Button onClick={() => setSearchSubmitted(false)} className="mt-4">
                ค้นหาใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const queue = queueInfo[0];
  const department = (queue as any).departments;
  const queuesBefore = department ? 
    department.current_queue !== queue.queue_number ?
      parseInt(queue.queue_number.substring(1)) - parseInt(department.current_queue.substring(1)) : 0
    : 3;
  
  const estimatedWaitTime = queuesBefore * 5;

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
            <div className="text-6xl font-bold text-hospital-600">{queue.queue_number}</div>
            <div className="text-sm text-muted-foreground mt-2">{department?.name || "แผนกทั่วไป"}</div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">คิวปัจจุบัน</span>
              <span className="font-medium">{department?.current_queue || "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">จำนวนคิวก่อนหน้า</span>
              <span className="font-medium">{queuesBefore} คิว</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">เวลารอโดยประมาณ</span>
              <span className="font-medium">{estimatedWaitTime} นาที</span>
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
