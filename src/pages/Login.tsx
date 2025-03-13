
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginUser } from "@/services/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unchecked' | 'success' | 'error'>('unchecked');
  const [testLoading, setTestLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await loginUser(email, password);
      toast.success("เข้าสู่ระบบสำเร็จ");
      navigate("/staff-dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน");
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setTestLoading(true);
    try {
      // ทดสอบการเชื่อมต่อโดยการดึงข้อมูลจากตาราง departments
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      setConnectionStatus('success');
      toast.success("เชื่อมต่อกับฐานข้อมูลสำเร็จ");
      console.log("Connection test data:", data);
    } catch (error) {
      console.error("Database connection error:", error);
      setConnectionStatus('error');
      toast.error("เชื่อมต่อกับฐานข้อมูลไม่สำเร็จ");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">เข้าสู่ระบบสำหรับเจ้าหน้าที่</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button 
              onClick={testConnection} 
              variant="outline" 
              className="w-full mb-4"
              disabled={testLoading}
            >
              {testLoading ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อฐานข้อมูล'}
            </Button>
            
            {connectionStatus !== 'unchecked' && (
              <Alert className={connectionStatus === 'success' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                {connectionStatus === 'success' ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <AlertTitle className={connectionStatus === 'success' ? "text-green-800" : "text-red-800"}>
                  {connectionStatus === 'success' ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อไม่สำเร็จ'}
                </AlertTitle>
                <AlertDescription className={connectionStatus === 'success' ? "text-green-700" : "text-red-700"}>
                  {connectionStatus === 'success' 
                    ? 'การเชื่อมต่อกับฐานข้อมูล Supabase ทำงานได้ตามปกติ' 
                    : 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล Supabase ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือการตั้งค่า'
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@hospital.com"
                required
              />
            </div>
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

export default Login;
