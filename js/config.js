/* Les Aisses Golf — connexion à Supabase (projet « les-aisses-golf », région Paris).
   Ces deux valeurs sont publiques par nature : la clé « anon » ne permet que la lecture,
   l'écriture est réservée à l'administrateur par les règles de sécurité de la base (supabase/schema.sql).
   Ne jamais mettre ici la clé « service_role » / « secret ». */
window.AISSES_CONFIG = {
  supabaseUrl: "https://cyhjmsrgccwtpkqoqxhu.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aGptc3JnY2N3dHBrcW9xeGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0OTIzNjgsImV4cCI6MjEwNzA2ODM2OH0.XAYgKnRYqEyHxAQ9qU2dLenOr4EIqIynO7bzBPaUbUk"
};
