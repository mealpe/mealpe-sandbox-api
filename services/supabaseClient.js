// import { createClient } from '@supabase/supabase-js'
const createClient = require("@supabase/supabase-js").createClient

const supabaseUrl = "https://tgohieumqkzgwbjlglkt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb2hpZXVtcWt6Z3diamxnbGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk4MzI4MjUsImV4cCI6MjAwNTQwODgyNX0.eexp1y7Kg4NBTvHKgCZ9jqqefP__BL3erQft7XKBJLI";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb2hpZXVtcWt6Z3diamxnbGt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTgzMjgyNSwiZXhwIjoyMDA1NDA4ODI1fQ.Kk2_il9HflktKo0EeC-1wXOPFZKuspp4O9V0W72xTLg"
const otherOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

const supabaseInstance = createClient(supabaseUrl, serviceRoleKey, otherOptions);
exports.supabase = supabaseInstance;