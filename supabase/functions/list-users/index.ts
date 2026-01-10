import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { organizationId } = await req.json();

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    console.log(`Listing users for organization: ${organizationId} by user: ${user.id}`);

    // Check if the requesting user is admin/gerente of this organization
    const { data: memberCheck, error: memberError } = await supabaseClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('active', true)
      .single();

    if (memberError || !memberCheck) {
      throw new Error('User is not a member of this organization');
    }

    // Only admin can list users (gerente removed from system)
    if (memberCheck.role !== 'admin') {
      throw new Error('Insufficient permissions - must be admin');
    }

    // Get all members of this organization with their profiles
    const { data: members, error: membersError } = await supabaseClient
      .from('organization_members')
      .select(`
        user_id,
        role,
        active,
        created_at,
        profiles(
          id,
          full_name
        )
      `)
      .eq('organization_id', organizationId);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw membersError;
    }

    // Get auth users to include emails
    const { data: { users: authUsers }, error: authUsersError } = await supabaseClient.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      throw authUsersError;
    }

    // Map the data to include email
    const usersWithEmail = members?.map(member => {
      const profile = member.profiles as any;
      const authUser = authUsers?.find(u => u.id === member.user_id);
      
      return {
        id: member.user_id,
        full_name: profile?.full_name || 'N/A',
        email: authUser?.email || 'N/A',
        role: member.role,
        active: member.active,
        created_at: member.created_at,
      };
    }) || [];

    console.log(`Found ${usersWithEmail.length} users for organization ${organizationId}`);

    return new Response(
      JSON.stringify({ users: usersWithEmail }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in list-users:', error);
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
