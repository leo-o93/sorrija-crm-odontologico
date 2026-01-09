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
    const baseIndex = parts.indexOf('admin-manage-organizations');
    const pathParts = baseIndex >= 0 ? parts.slice(baseIndex + 1) : parts;

    if (req.method === 'GET' && pathParts.length === 0) {
      const { data, error: orgError } = await supabase
        .from('organizations')
        .select('*, organization_members(count), leads(count)')
        .order('created_at', { ascending: false });

      if (orgError) throw orgError;

      return new Response(JSON.stringify({ organizations: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && pathParts.length === 0) {
      const payload = await req.json();
      
      // Extrair dados do admin do payload
      const { createAdmin, adminFullName, adminEmail, adminPassword, ...orgData } = payload;

      // Criar organização
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();

      if (createError) throw createError;

      // Criar regras de transição padrão
      await supabase.rpc('create_default_transition_rules', { org_id: newOrg.id });

      let createdAdminInfo = null;

      // Se solicitado, criar usuário admin para a organização
      if (createAdmin && adminEmail && adminPassword && adminFullName) {
        console.log('Creating admin user for organization:', newOrg.id, adminEmail);

        const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: adminFullName },
        });

        if (userError) {
          console.error('Error creating admin user:', userError);
          // Retornar erro mas manter a organização criada
          return new Response(JSON.stringify({ 
            organization: newOrg, 
            adminError: userError.message,
            message: 'Organização criada, mas houve erro ao criar o usuário admin'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          });
        }

        if (newUser?.user) {
          console.log('Admin user created:', newUser.user.id);

          // Criar perfil do usuário
          const { error: profileError } = await supabase.from('profiles').insert({
            id: newUser.user.id,
            full_name: adminFullName,
            role: 'admin',
            active: true,
          });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }

          // Criar role do usuário
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: newUser.user.id,
            role: 'admin',
          });

          if (roleError) {
            console.error('Error creating user role:', roleError);
          }

          // Adicionar como membro admin da organização
          const { error: memberError } = await supabase.from('organization_members').insert({
            organization_id: newOrg.id,
            user_id: newUser.user.id,
            role: 'admin',
            active: true,
          });

          if (memberError) {
            console.error('Error adding member:', memberError);
          }

          createdAdminInfo = {
            userId: newUser.user.id,
            email: adminEmail,
            fullName: adminFullName,
          };

          // Log de auditoria para criação do admin
          await logAudit({
            adminUserId: user.id,
            action: 'create_org_admin',
            targetType: 'user',
            targetId: newUser.user.id,
            details: { organizationId: newOrg.id, email: adminEmail, fullName: adminFullName },
            req,
          });
        }
      }

      // Log de auditoria para criação da organização
      await logAudit({
        adminUserId: user.id,
        action: 'create_organization',
        targetType: 'organization',
        targetId: newOrg.id,
        details: { ...orgData, adminCreated: !!createdAdminInfo },
        req,
      });

      return new Response(JSON.stringify({ 
        organization: newOrg,
        adminCreated: createdAdminInfo,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (req.method === 'PUT' && pathParts.length === 1) {
      const organizationId = pathParts[0];
      const payload = await req.json();
      const { data, error: updateError } = await supabase
        .from('organizations')
        .update(payload)
        .eq('id', organizationId)
        .select()
        .single();

      if (updateError) throw updateError;

      await logAudit({
        adminUserId: user.id,
        action: 'update_organization',
        targetType: 'organization',
        targetId: organizationId,
        details: payload,
        req,
      });

      return new Response(JSON.stringify({ organization: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE' && pathParts.length === 1) {
      const organizationId = pathParts[0];
      const { error: deleteError } = await supabase
        .from('organizations')
        .update({ active: false })
        .eq('id', organizationId);

      if (deleteError) throw deleteError;

      await logAudit({
        adminUserId: user.id,
        action: 'deactivate_organization',
        targetType: 'organization',
        targetId: organizationId,
        req,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'members') {
      const organizationId = pathParts[0];
      console.log('Fetching members for organization:', organizationId);
      
      // Buscar membros da organização
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('id, user_id, role, active')
        .eq('organization_id', organizationId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }
      
      // Buscar perfis separadamente para evitar problemas de FK
      const userIds = membersData?.map(m => m.user_id) || [];
      let profilesMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profilesMap = (profilesData || []).reduce((acc, p) => {
            acc[p.id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Combinar dados
      const members = (membersData || []).map(m => ({
        ...m,
        profiles: { full_name: profilesMap[m.user_id] || 'Usuário sem perfil' }
      }));
      
      console.log('Members found:', members.length);

      return new Response(JSON.stringify({ members }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'members') {
      const organizationId = pathParts[0];
      const { email, role } = await req.json();

      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const targetUser = usersData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error: insertError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: targetUser.id,
          role,
          active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await logAudit({
        adminUserId: user.id,
        action: 'add_member',
        targetType: 'organization_member',
        targetId: data.id,
        details: { organizationId, email, role },
        req,
      });

      return new Response(JSON.stringify({ member: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (
      req.method === 'DELETE' &&
      pathParts.length === 3 &&
      pathParts[1] === 'members'
    ) {
      const organizationId = pathParts[0];
      const memberUserId = pathParts[2];

      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', memberUserId);

      if (deleteError) throw deleteError;

      await logAudit({
        adminUserId: user.id,
        action: 'remove_member',
        targetType: 'organization_member',
        targetId: memberUserId,
        details: { organizationId },
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
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Error in admin-manage-organizations:', message);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    if (stack) console.error('Stack trace:', stack);
    return new Response(JSON.stringify({ error: message, details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
