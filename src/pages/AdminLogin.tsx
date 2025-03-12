
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // แค่ตรวจสอบว่ารหัสคือ "root" (ไม่มีการตรวจสอบกับฐานข้อมูล)
    if (password === "กลุ่ม3มี3คน") {
      // เก็บสถานะการล็อกอินไว้ใน sessionStorage เพื่อให้สามารถรีเฟรชหน้าได้
      sessionStorage.setItem("adminAuthenticated", "true");
      toast.success("เข้าสู่ระบบสำเร็จ");
      navigate("/admin-dashboard");
    } else {
      toast.error("รหัสผ่านไม่ถูกต้อง");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">เข้าสู่ระบบผู้ดูแลระบบ (ทดสอบ)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
