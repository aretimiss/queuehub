
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QueueStatsProps {
  departmentId: string;
}

interface DashboardStats {
  id: string;
  department_id: string;
  waiting_count: number;
  called_count: number;
  serving_count: number;
  completed_count: number;
  cancelled_count: number;
  updated_at: string;
}

const QueueStats = ({ departmentId }: QueueStatsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const { data, error } = await supabase
          .from('dashboard_stats')
          .select('*')
          .eq('department_id', departmentId)
          .single();
          
        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
    
    // Set up real-time subscription for dashboard stats updates
    const subscription = supabase
      .channel(`dashboard_stats_${departmentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dashboard_stats',
        filter: `department_id=eq.${departmentId}`
      }, (payload) => {
        setStats(payload.new as DashboardStats);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [departmentId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-10 w-10 text-hospital-600 animate-spin" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center">
        <p className="text-red-500">ไม่สามารถโหลดข้อมูลคิวได้</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="border-hospital-100">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {stats.waiting_count}
          </div>
          <div className="text-sm text-muted-foreground mt-2">รอเรียก</div>
        </CardContent>
      </Card>
      <Card className="border-hospital-100">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {stats.called_count + stats.serving_count}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            เรียกแล้ว/กำลังให้บริการ
          </div>
        </CardContent>
      </Card>
      <Card className="border-hospital-100">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {stats.completed_count}
          </div>
          <div className="text-sm text-muted-foreground mt-2">เสร็จสิ้น</div>
        </CardContent>
      </Card>
      <Card className="border-hospital-100">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl font-bold text-hospital-600">
            {stats.cancelled_count}
          </div>
          <div className="text-sm text-muted-foreground mt-2">ยกเลิก</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueStats;
