-- PASSO 1: Remover TODAS as policies primeiro (antes de remover colunas)
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;

DROP POLICY IF EXISTS "Users can create conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations from their organization" ON conversations;

DROP POLICY IF EXISTS "Admins can manage integration settings" ON integration_settings;
DROP POLICY IF EXISTS "Admins can view integration settings" ON integration_settings;

DROP POLICY IF EXISTS "Authenticated users can insert lead interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Authenticated users can view lead interactions" ON lead_interactions;

DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON leads;

DROP POLICY IF EXISTS "Users can create messages in their organization conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their organization conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages from their organization conversations" ON messages;

DROP POLICY IF EXISTS "Admins can delete patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can view all patients" ON patients;

DROP POLICY IF EXISTS "Admins can manage procedures" ON procedures;
DROP POLICY IF EXISTS "Authenticated users can view procedures" ON procedures;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can manage sources" ON sources;
DROP POLICY IF EXISTS "Authenticated users can view sources" ON sources;

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON user_roles;

DROP POLICY IF EXISTS "Admins can delete webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admins can update webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admins can view all webhooks" ON webhooks;

DROP POLICY IF EXISTS "Users can create memberships for new organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Members can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;

-- PASSO 2: Desabilitar RLS em todas as tabelas
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE procedures DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- PASSO 3: Remover tabelas de organização
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- PASSO 4: Remover colunas organization_id
ALTER TABLE leads DROP COLUMN IF EXISTS organization_id;
ALTER TABLE patients DROP COLUMN IF EXISTS organization_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS organization_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS organization_id;
ALTER TABLE sources DROP COLUMN IF EXISTS organization_id;
ALTER TABLE integration_settings DROP COLUMN IF EXISTS organization_id;

-- PASSO 5: Criar tabela de configuração global da Evolution API
CREATE TABLE IF NOT EXISTS evolution_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evolution_base_url text NOT NULL,
  evolution_api_key text NOT NULL,
  evolution_instance text NOT NULL,
  webhook_secret text,
  n8n_outgoing_url text,
  active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_evolution_config_updated_at
  BEFORE UPDATE ON evolution_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();