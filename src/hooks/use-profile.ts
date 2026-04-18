import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './use-auth'

export type UserProfile = {
  id: string
  full_name: string | null
  age: number | null
  gender: string | null
  city: string | null
  height_cm: number | null
  weight_kg: number | null
  target_weight_kg: number | null
  physical_limitations: string[]
  sport_types: string[]
  sport_frequency: string | null
  sport_location: string | null
  sport_level: string | null
  interest_topics: string[]
  onboarding_completed: boolean
}

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user_profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return (data ?? null) as UserProfile | null
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Omit<UserProfile, 'id'>>) => {
      if (!user) throw new Error('Not authenticated')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_profile')
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile'] })
    },
  })
}
