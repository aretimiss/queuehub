
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
import { Calendar, User } from "lucide-react";

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
    <div className="max-w-full sm:max-w-md mx-auto px-4 sm:px-0">
      <div className="mb-6 text-center">
        <p className="text-muted-foreground text-sm mt-1">
          ลงทะเบียนด้วยเลขบัตรประชาชน รับคิวอัตโนมัติ พร้อมการแจ้งเตือนเมื่อใกล้ถึงคิว
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          กรุณาแสดงบัตรประชาชนพร้อมหมายเลขคิว
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-center">
            <Calendar className="mr-2 h-5 w-5 text-hospital-600" />
            <span>จองคิว</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <Label htmlFor="idCard">เลขบัตรประชาชน</Label>
              </div>
              <Input
                id="idCard"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                maxLength={13}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label>แผนก</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-full text-base">
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
              className="w-full mt-4 py-6 text-base"
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
