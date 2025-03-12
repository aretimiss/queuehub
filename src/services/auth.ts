
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from "@/lib/types";

export const loginUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string, name: string, departmentId?: string) => {
  try {
    // ลงทะเบียนผู้ใช้ใหม่
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      toast.error(authError.message);
      throw authError;
    }

    if (!authData.user) {
      toast.error("การลงทะเบียนล้มเหลว");
      throw new Error("การลงทะเบียนล้มเหลว");
    }

    // สร้างข้อมูลเจ้าหน้าที่
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .insert({
        email,
        name,
        department_id: departmentId || null,
      })
      .select()
      .single();

    if (staffError) {
      toast.error(staffError.message);
      throw staffError;
    }

    // อัปเดตโปรไฟล์ด้วย staff_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        staff_id: staffData.id
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    return authData;
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error("Error in getCurrentProfile:", error);
    return null;
  }
};

// เพิ่มฟังก์ชั่นสำหรับดึงข้อมูลเจ้าหน้าที่
export const getStaffDetails = async (staffId: string) => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .single();

  if (error) {
    console.error("Error fetching staff details:", error);
    return null;
  }

  return data;
};
