import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const getUserFromRequest = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { error: new Error('Authorization header required') };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: new Error('Invalid token') };
  }

  return { user: data.user };
};

const ensureSuperAdmin = async (userId: string) => {
  const { data, error } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
};

const logAudit = async ({
  adminUserId,
  action,
  targetType,
  targetId,
  details,
  req,
}: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  req: Request;
}) => {
  await supabase.from('admin_audit_log').insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details || {},
    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    user_agent: req.headers.get('user-agent'),
  });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, error } = await getUserFromRequest(req);
    if (error || !user) {
      return new Response(JSON.stringify({ error: error?.message || 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSuperAdmin = await ensureSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const baseIndex = parts.indexOf('admin-manage-users');
    const pathParts = baseIndex >= 0 ? parts.slice(baseIndex + 1) : parts;

    if (req.method === 'GET' && pathParts.length === 0) {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const userIds = usersData.users.map((userItem) => userItem.id);
      let profiles: Array<{ id: string; full_name: string | null; role: string | null }> = [];
      if (userIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profiles = data || [];
      }

      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('user_id, organization_id, role, active, organizations(name)');

      if (membershipError) throw membershipError;

      const users = usersData.users.map((userItem) => {
        const userMemberships = (memberships || []).filter((member) => member.user_id === userItem.id);
        const profile = (profiles || []).find((item) => item.id === userItem.id);
        return {
          id: userItem.id,
          email: userItem.email,
          full_name: profile?.full_name || null,
          role: profile?.role || null,
          created_at: userItem.created_at,
          last_sign_in_at: userItem.last_sign_in_at,
          banned_until: userItem.banned_until,
          organizations: userMemberships.map((member) => ({
            organization_id: member.organization_id,
            organization_name: (member.organizations as any)?.name,
            role: member.role,
            active: member.active,
          })),
        };
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'reset-password') {
      const userId = pathParts[0];
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError || !userData?.user?.email) throw userError;

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: userData.user.email,
      });

      if (linkError) throw linkError;

      await logAudit({
        adminUserId: user.id,
        action: 'reset_password',
        targetType: 'user',
        targetId: userId,
        details: { email: userData.user.email },
        req,
      });

      return new Response(JSON.stringify({ action_link: linkData.properties?.action_link }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT' && pathParts.length === 2 && pathParts[1] === 'block') {
      const userId = pathParts[0];
      const { blocked } = await req.json();
      const banDuration = blocked ? '87600h' : 'none';

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: banDuration,
      });

      if (updateError) throw updateError;

      await logAudit({
        adminUserId: user.id,
        action: blocked ? 'block_user' : 'unblock_user',
        targetType: 'user',
        targetId: userId,
        details: { blocked },
        req,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
