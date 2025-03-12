
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

const departments = [
  { id: "general", name: "แผนกทั่วไป" },
  { id: "dental", name: "ทันตกรรม" },
  { id: "eye", name: "จักษุ" },
  { id: "skin", name: "ผิวหนัง" },
  { id: "cardio", name: "หัวใจ" },
];

const Index = () => {
  const [idCard, setIdCard] = useState("");
  const [department, setDepartment] = useState("general");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (idCard.length !== 13) {
      toast({
        variant: "destructive",
        title: "กรุณากรอกเลขบัตรประชาชน 13 หลัก",
      });
      return;
    }

    // Here we would normally make an API call to save the queue
    toast({
      title: "จองคิวสำเร็จ",
      description: "กรุณารอเรียกคิวที่หน้าจอ",
    });

    navigate("/my-queue");
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
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
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
            <Button type="submit" className="w-full">
              จองคิว
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
