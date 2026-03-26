'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*, institution:institutions(*)')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export function useProfile() {
  const { data: profile, error, isLoading, mutate } = useSWR(
    'user-profile',
    fetchProfile,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 30000,
    }
  )

  return {
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    isUser: profile?.role === 'user',
    error,
    mutate,
  }
}
