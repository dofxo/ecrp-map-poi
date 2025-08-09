import {createClient} from "@supabase/supabase-js";

const supabaseUrl = "https://vhdeninkkmhyricqpfsx.supabase.co"
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZGVuaW5ra21oeXJpY3FwZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDQ4MjUsImV4cCI6MjA3MDMyMDgyNX0.5Fz6ImNSh9PSTEgWcfrmOXoyb1kQb22B8PYb3JX7DQI"


export const supabase = createClient(supabaseUrl, supabaseAnonKey)
