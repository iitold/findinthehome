'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Lấy profile từ bảng profiles
  const fetchProfile = async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    // Lấy session hiện tại
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
      setLoading(false);
    });

    // Lắng nghe thay đổi auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) fetchProfile(u.id);
        else setProfile(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password,
    });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
    });

    // Sau khi đăng ký thành công, tạo profile (first user = admin)
    if (!error && data?.user) {
      await supabase.rpc('create_profile_for_user', {
        user_id: data.user.id,
        user_email: email,
      });
      await fetchProfile(data.user.id);
    }

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setProfile(null);
    return { error };
  };

  const isAdmin = profile?.role === 'admin';

  return { user, profile, loading, signIn, signUp, signOut, isAdmin };
}
