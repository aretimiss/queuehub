
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQueue, fetchAllDepartments } from "@/services/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const Index = () => {
  const [idCard, setIdCard] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const { toast: uiToast } = useToast();
  const navigate = useNavigate();

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchAllDepartments
  });

  // Create queue mutation
  const createQueueMutation = useMutation({
    mutationFn: ({ idCard, departmentId }: { idCard: string, departmentId: string }) => 
      createQueue(idCard, departmentId),
    onSuccess: () => {
      toast.success("จองคิวสำเร็จ");
      navigate("/my-queue", { state: { idCard } });
    },
    onError: (error) => {
      console.error("Error creating queue:", error);
      uiToast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถจองคิวได้ กรุณาลองใหม่อีกครั้ง"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (idCard.length !== 13) {
      uiToast({
        variant: "destructive",
        title: "กรุณากรอกเลขบัตรประชาชน 13 หลัก",
      });
      return;
    }

    if (!departmentId) {
      uiToast({
        variant: "destructive",
        title: "กรุณาเลือกแผนก",
      });
      return;
    }

    createQueueMutation.mutate({ idCard, departmentId });
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>จองคิว</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="idCard">เลขบัตรประชาชน</Label>
              <Input
                id="idCard"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                maxLength={13}
              />
            </div>
            <div className="space-y-2">
              <Label>แผนก</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={createQueueMutation.isPending}
            >
              {createQueueMutation.isPending ? "กำลังจองคิว..." : "จองคิว"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
