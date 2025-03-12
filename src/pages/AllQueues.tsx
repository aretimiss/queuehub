
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAllDepartments } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AllQueues = () => {
  const { 
    data: departments = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['allDepartments'],
    queryFn: fetchAllDepartments
  });

  useEffect(() => {
    // Subscribe to department changes for realtime updates
    const channel = supabase
      .channel('department-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departments',
        },
        (payload) => {
          console.log('Department changed:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-10 w-10 text-hospital-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id} className="animate-slideIn">
            <CardHeader>
              <CardTitle>{dept.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-hospital-600">
                  {dept.current_queue || "-"}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  คิวปัจจุบัน
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">คิวที่รอ</span>
                <span className="font-medium">{dept.total_waiting || 0} คิว</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllQueues;
