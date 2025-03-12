
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const LoadingState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-md mx-auto text-center pt-10">
      <Card>
        <CardContent className="pt-6">
          <p>กรุณาเข้าสู่ระบบอีกครั้ง</p>
          <Button onClick={() => navigate("/login")} className="mt-4">
            ไปยังหน้าเข้าสู่ระบบ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingState;
