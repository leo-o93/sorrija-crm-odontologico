import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'gerente' | 'comercial' | 'recepcao' | 'dentista';
  organizationId: string;
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

    // Verify the caller is authenticated and has admin/gerente role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { fullName, email, password, role, organizationId }: CreateUserRequest = await req.json();

    if (!fullName || !email || !password || !role || !organizationId) {
      throw new Error('Missing required fields (fullName, email, password, role, organizationId)');
    }

    // Check if user is admin/gerente of the target organization
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

    if (memberCheck.role !== 'admin' && memberCheck.role !== 'gerente') {
      throw new Error('Insufficient permissions - must be admin or gerente of this organization');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
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

    // The trigger handle_new_user will automatically create the profile and user_role
    // Update profile role if not recepcao
    if (role !== 'recepcao') {
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
      // Don't throw - user is created, just log the error
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
