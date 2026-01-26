import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'gerente' | 'comercial' | 'recepcao' | 'dentista' | 'usuario';
  organizationId: string;
}

// Input validation helpers
const VALID_ROLES = ['admin', 'gerente', 'comercial', 'recepcao', 'dentista', 'usuario'] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function validateInput(data: unknown): CreateUserRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }

  const { fullName, email, password, role, organizationId } = data as Record<string, unknown>;

  // Validate fullName
  if (typeof fullName !== 'string' || !fullName.trim()) {
    throw new Error('Full name is required');
  }
  if (fullName.length > MAX_NAME_LENGTH) {
    throw new Error(`Full name must be less than ${MAX_NAME_LENGTH} characters`);
  }
  // Sanitize name - remove potentially dangerous characters
  const sanitizedName = fullName.trim().replace(/[<>'"&]/g, '');
  if (sanitizedName.length < 2) {
    throw new Error('Full name must be at least 2 characters');
  }

  // Validate email
  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('Email is required');
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error(`Email must be less than ${MAX_EMAIL_LENGTH} characters`);
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error('Invalid email format');
  }

  // Validate password
  if (typeof password !== 'string') {
    throw new Error('Password is required');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must be less than ${MAX_PASSWORD_LENGTH} characters`);
  }
  // Check for at least one letter and one number
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one letter and one number');
  }

  // Validate role - accept new simplified roles
  if (typeof role !== 'string' || !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  // Validate organizationId (UUID format)
  if (typeof organizationId !== 'string' || !UUID_REGEX.test(organizationId)) {
    throw new Error('Invalid organization ID format');
  }

  return {
    fullName: sanitizedName,
    email: normalizedEmail,
    password,
    role: role as CreateUserRequest['role'],
    organizationId,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse and validate input
    const rawData = await req.json();
    const { fullName, email, password, role, organizationId } = validateInput(rawData);

    // Check if user is Super Admin
    const { data: superAdmin } = await supabaseClient
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdmin;

    // If not super admin, check organization membership
    if (!isSuperAdmin) {
      const { data: memberCheck, error: memberError } = await supabaseClient
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('active', true)
        .single();

      if (memberError || !memberCheck) {
        throw new Error('You are not a member of this organization');
      }

      // Only admin can create users
      if (memberCheck.role !== 'admin') {
        throw new Error('Insufficient permissions - must be admin of this organization');
      }
    }

    console.log(`Creating user: ${email} with role: ${role}`);

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log(`User created successfully: ${newUser.user.id}`);

    // Update profile role
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ role })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile role:', profileError);
    }

    const { error: roleUpdateError } = await supabaseClient
      .from('user_roles')
      .update({ role })
      .eq('user_id', newUser.user.id);

    if (roleUpdateError) {
      console.error('Error updating user role:', roleUpdateError);
    }

    // Add user to the organization with the specified role
    const { error: orgMemberError } = await supabaseClient
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: newUser.user.id,
        role: role,
        active: true,
      });

    if (orgMemberError) {
      console.error('Error adding user to organization:', orgMemberError);
    } else {
      console.log(`User ${newUser.user.id} added to organization ${organizationId} with role ${role}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email 
        } 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in admin-create-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
