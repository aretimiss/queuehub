
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllDepartments } from "@/services/api";
import { Department, Queue } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DatabaseTest = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [testIdCard, setTestIdCard] = useState<string>("1234567890123");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("queues");
  const [testResults, setTestResults] = useState<any[]>([]);

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchAllDepartments
  });

  // Select first department by default when loaded
  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(departments[0].id);
    }
  }, [departments, selectedDepartment]);

  // Test database connection for queues
  const testQueuesDatabase = async () => {
    if (!selectedDepartment) {
      toast.error("กรุณาเลือกแผนก");
      return;
    }

    setIsLoading(true);
    setTestResults([]);
    
    try {
      // 1. ทดสอบการดึงข้อมูลคิวทั้งหมด
      const { data: allQueues, error: queuesError } = await supabase
        .from('queues')
        .select('*, department:department_id(*), patient:patient_id(*)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (queuesError) throw queuesError;
      
      // 2. ทดสอบการดึงคิวตามแผนก
      const { data: deptQueues, error: deptQueuesError } = await supabase
        .from('queues')
        .select('*, patient:patient_id(*)')
        .eq('department_id', selectedDepartment)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (deptQueuesError) throw deptQueuesError;
      
      // 3. นับจำนวนคิวตามสถานะ
      const { data: statusCounts, error: statusError } = await supabase
        .from('queues')
        .select('status, count(*)')
        .eq('department_id', selectedDepartment)
        .order('status')
        .then(({ data, error }) => {
          if (error) throw error;
          // Process the data to get counts
          const counts = {};
          data.forEach(item => {
            counts[item.status] = item.count;
          });
          return { data: counts, error: null };
        });
      
      if (statusError) throw statusError;

      setTestResults([
        {
          name: "คิวทั้งหมด",
          data: allQueues,
          type: "queues",
        },
        {
          name: "คิวของแผนก",
          data: deptQueues,
          type: "queues",
        },
        {
          name: "จำนวนคิวตามสถานะ",
          data: statusCounts,
          type: "counts",
        }
      ]);
      
      toast.success("ทดสอบการเชื่อมต่อฐานข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Database test error:", error);
      toast.error("เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อฐานข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  // Test creating a new queue
  const testCreateQueue = async () => {
    if (!selectedDepartment) {
      toast.error("กรุณาเลือกแผนก");
      return;
    }

    if (!testIdCard || testIdCard.length !== 13) {
      toast.error("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. ตรวจสอบว่ามีผู้ป่วยในระบบหรือไม่
      let patientId;
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('id_card', testIdCard)
        .maybeSingle();
      
      if (existingPatient) {
        patientId = existingPatient.id;
        toast.info("พบข้อมูลผู้ป่วยในระบบ");
      } else {
        // สร้างผู้ป่วยใหม่
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({ id_card: testIdCard })
          .select()
          .single();
        
        if (patientError) throw patientError;
        
        patientId = newPatient.id;
        toast.info("สร้างข้อมูลผู้ป่วยใหม่");
      }
      
      // 2. ดึงข้อมูลแผนกเพื่อสร้างเลขคิว
      const { data: department } = await supabase
        .from('departments')
        .select('code, current_queue, total_waiting')
        .eq('id', selectedDepartment)
        .single();
      
      if (!department) {
        throw new Error("ไม่พบข้อมูลแผนก");
      }
      
      // 3. สร้างเลขคิวใหม่
      const prefix = department.code.charAt(0).toUpperCase();
      let number = 1;
      
      if (department.current_queue) {
        const currentNumber = parseInt(department.current_queue.substring(1));
        if (!isNaN(currentNumber)) {
          number = currentNumber + 1;
        }
      }
      
      const queueNumber = `${prefix}${number.toString().padStart(3, '0')}`;
      
      // 4. สร้างคิว
      const { data: newQueue, error: queueError } = await supabase
        .from('queues')
        .insert({
          queue_number: queueNumber,
          patient_id: patientId,
          department_id: selectedDepartment,
          status: 'waiting'
        })
        .select()
        .single();
      
      if (queueError) throw queueError;
      
      // 5. อัปเดตข้อมูลแผนก
      await supabase
        .from('departments')
        .update({
          current_queue: queueNumber,
          total_waiting: department.total_waiting ? department.total_waiting + 1 : 1
        })
        .eq('id', selectedDepartment);
      
      toast.success(`สร้างคิวใหม่เรียบร้อย: ${queueNumber}`);
      
      // ทดสอบการเชื่อมต่อใหม่เพื่อดึงข้อมูลล่าสุด
      testQueuesDatabase();
    } catch (error) {
      console.error("Error creating queue:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างคิว");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-hospital-700">หน้าทดสอบการเชื่อมต่อฐานข้อมูล</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ทดสอบการเชื่อมต่อและจัดการคิว</CardTitle>
          <CardDescription>ทดสอบการเชื่อมต่อกับฐานข้อมูล Supabase และการจัดการคิว</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">เลือกแผนก</Label>
                <Select value={selectedDepartment || ''} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department">
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
              
              <div>
                <Label htmlFor="idCard">เลขบัตรประชาชนทดสอบ</Label>
                <Input
                  id="idCard"
                  value={testIdCard}
                  onChange={(e) => setTestIdCard(e.target.value)}
                  placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                  maxLength={13}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={testQueuesDatabase}
                disabled={isLoading || !selectedDepartment}
                variant="outline"
              >
                {isLoading && activeTab === 'queues' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                ทดสอบดึงข้อมูลคิว
              </Button>
              
              <Button
                onClick={testCreateQueue}
                disabled={isLoading || !selectedDepartment}
              >
                {isLoading && activeTab === 'create' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                ทดสอบสร้างคิวใหม่
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queues">ผลลัพธ์การทดสอบ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="queues">
          {testResults.length > 0 ? (
            <div className="space-y-6">
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{result.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.type === "queues" ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>หมายเลขคิว</TableHead>
                            <TableHead>เลขบัตรประชาชน</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead>เวลาสร้าง</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.data.length > 0 ? (
                            result.data.map((queue: any) => (
                              <TableRow key={queue.id}>
                                <TableCell className="font-medium">{queue.queue_number}</TableCell>
                                <TableCell>{queue.patient?.id_card}</TableCell>
                                <TableCell>{queue.status}</TableCell>
                                <TableCell>{new Date(queue.created_at).toLocaleString()}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">ไม่พบข้อมูล</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : result.type === "counts" ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>สถานะ</TableHead>
                            <TableHead>จำนวน</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.data.length > 0 ? (
                            result.data.map((item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{item.status}</TableCell>
                                <TableCell>{item.count}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center">ไม่พบข้อมูล</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="text-center text-muted-foreground">
                  กดปุ่มทดสอบเพื่อแสดงผลลัพธ์
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseTest;
