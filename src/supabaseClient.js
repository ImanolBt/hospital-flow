import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://unovrjrnsbuocjfyivei.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVub3ZyanJuc2J1b2NqZnlpdmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzU2NTcsImV4cCI6MjA4NzI1MTY1N30.tx1ooxOfB9D6M6LD6nm2qHfYsnWyfQOdNW74mA96x6o'

export const supabase = createClient(supabaseUrl, supabaseKey)