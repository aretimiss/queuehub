
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const departments = [
  {
    id: "general",
    name: "แผนกทั่วไป",
    currentQueue: "A123",
    totalWaiting: 15,
  },
  {
    id: "dental",
    name: "ทันตกรรม",
    currentQueue: "B045",
    totalWaiting: 8,
  },
  {
    id: "eye",
    name: "จักษุ",
    currentQueue: "C012",
    totalWaiting: 10,
  },
  {
    id: "skin",
    name: "ผิวหนัง",
    currentQueue: "D034",
    totalWaiting: 5,
  },
  {
    id: "cardio",
    name: "หัวใจ",
    currentQueue: "E007",
    totalWaiting: 12,
  },
];

const AllQueues = () => {
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
                  {dept.currentQueue}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  คิวปัจจุบัน
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">คิวที่รอ</span>
                <span className="font-medium">{dept.totalWaiting} คิว</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllQueues;
