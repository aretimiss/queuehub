
import React from "react";

export function Footer() {
  return (
    <footer className="py-6 border-t mt-auto">
      <div className="container text-center">
        <p className="text-muted-foreground mb-2">
          © ผู้จัดทำนักศึกษามหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก
        </p>
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold mb-1">รายชื่อผู้จัดทำ</p>
          <p>นายกำพน ชื่นชม</p>
          <p>นางสาววณิดา แสงทับทิม</p>
          <p>นางสาวอริษา นิลกิจ</p>
        </div>
      </div>
    </footer>
  );
}
