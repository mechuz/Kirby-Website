// Supabase project behind kirbygateliving.com/mock-survey/.
// Both values are meant to be public: the key only lets someone try to sign
// in. Every read and write is checked in the database against the staff
// table (see docs/mock-survey/schema.sql). Never put the service_role key here.
window.KG_SURVEY = {
  url: "",      // e.g. https://abcdefghijklmnop.supabase.co
  anonKey: ""   // Project Settings > API Keys > publishable (or legacy anon) key
};
