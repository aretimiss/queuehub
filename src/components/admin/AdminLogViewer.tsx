
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  created_at: string;
}

const AdminLogViewer = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching admin logs:", err);
        setError("ไม่สามารถโหลดข้อมูลบันทึกการทำงานได้");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
    
    // Set up real-time updates
    const subscription = supabase
      .channel('admin_logs_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_logs'
      }, (payload) => {
        setLogs(prevLogs => [payload.new as AdminLog, ...prevLogs.slice(0, 19)]);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>บันทึกการทำงานของผู้ดูแลระบบ</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-hospital-600" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">ไม่พบข้อมูลบันทึกการทำงาน</div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>การกระทำ</TableHead>
                  <TableHead>ทรัพยากร</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                    <TableCell>{log.admin_id}</TableCell>
                    <TableCell>
                      <span className="capitalize">{log.action.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>{log.resource_type || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminLogViewer;
