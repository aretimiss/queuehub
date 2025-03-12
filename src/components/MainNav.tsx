
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Calendar, Clipboard, User } from "lucide-react";

export function MainNav() {
  const location = useLocation();

  const navigation = [
    {
      name: "จองคิว",
      href: "/",
      icon: Calendar,
    },
    {
      name: "คิวของฉัน",
      href: "/my-queue",
      icon: User,
    },
    {
      name: "คิวทั้งหมด",
      href: "/all-queues",
      icon: Clipboard,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:relative md:border-t-0 z-50">
      <div className="container flex justify-around md:justify-start md:space-x-8 py-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-3 py-2 text-sm transition-colors hover:text-hospital-600",
                isActive ? "text-hospital-600" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
