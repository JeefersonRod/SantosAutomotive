import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import session from "cookie-session";
import bcrypt from "bcryptjs";
import webpush from "web-push";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const supabaseUrl = process.env.SUPABASE_URL || process.env.URL_SUPABASE || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const configuredAdminUsername = process.env.ADMIN_USERNAME || process.env.DEFAULT_ADMIN_USERNAME || '';
const configuredAdminPassword = process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD || '';
const defaultAdminUsername = configuredAdminUsername || (isProduction ? '' : "admin");
const defaultAdminPassword = configuredAdminPassword || (isProduction ? '' : "admin123");
const defaultAdminName = process.env.ADMIN_NAME || process.env.DEFAULT_ADMIN_NAME || "Administrador Chefe";
const sessionSecret = process.env.SESSION_SECRET || process.env.SESSÃO_SECRETO || '';
const inferredPublicOrigin = process.env.PUBLIC_APP_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || inferredPublicOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const webPushPublicKey = process.env.WEB_PUSH_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const webPushPrivateKey = process.env.WEB_PUSH_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY || '';
const webPushSubject = process.env.WEB_PUSH_SUBJECT || process.env.VAPID_SUBJECT || 'mailto:admin@santosautomotive.local';

if (isProduction) {
  const missing = [
    !supabaseUrl && "SUPABASE_URL",
    !supabaseKey && "SUPABASE_SERVICE_ROLE_KEY",
    !sessionSecret && "SESSION_SECRET",
    !configuredAdminUsername && "ADMIN_USERNAME",
    !configuredAdminPassword && "ADMIN_PASSWORD",
    allowedOrigins.length === 0 && "ALLOWED_ORIGINS"
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }

  if (configuredAdminUsername === "admin" || configuredAdminPassword === "admin123") {
    throw new Error("Unsafe default admin credentials are not allowed in production.");
  }
}

if (webPushPublicKey && webPushPrivateKey) {
  webpush.setVapidDetails(webPushSubject, webPushPublicKey, webPushPrivateKey);
} else if (!isProduction) {
  console.warn("WEB_PUSH_PUBLIC_KEY or WEB_PUSH_PRIVATE_KEY missing. Push notifications will be disabled.");
}

let supabase: any;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.error("CRITICAL: SUPABASE_URL or SUPABASE_KEY is missing from environment variables!");
  }
} catch (err) {
  console.error("Failed to initialize Supabase client:", err);
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set("trust proxy", true);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString()
  });
});

const buildHealthDetails = async () => {
  let dbStatus = "not_checked";
  let dbError = null;
  let dbErrorDetails: any = null;

  if (supabase) {
    try {
      // Test database connection and schema by checking staff_members table
      const { error } = await supabase.from("staff_members").select("id").limit(1);
      if (error) {
        dbStatus = "error";
        dbError = error.message;
        dbErrorDetails = {
          code: error.code,
          details: error.details,
          hint: error.hint
        };
      } else {
        dbStatus = "connected";
        
        const { error: pushError } = await supabase.from("push_subscriptions").select("id").limit(1);
        if (pushError) {
          console.warn("push_subscriptions table might be missing:", pushError.message);
        }
      }
    } catch (err: any) {
      dbStatus = "exception";
      dbError = err.message;
      dbErrorDetails = {
        name: err.name,
        cause: err.cause ? {
          code: err.cause.code,
          errno: err.cause.errno,
          syscall: err.cause.syscall,
          hostname: err.cause.hostname,
          message: err.cause.message
        } : null
      };
    }
  }

  let supabaseHost = null;
  let supabaseUrlValid = false;
  try {
    if (supabaseUrl) {
      const parsedUrl = new URL(supabaseUrl);
      supabaseHost = parsedUrl.hostname;
      supabaseUrlValid = parsedUrl.protocol === "https:";
    }
  } catch (err) {
    supabaseUrlValid = false;
  }

  return {
    status: "ok", 
    time: new Date().toISOString(),
    supabase: !!supabase,
    database: dbStatus,
    database_error: dbError,
    database_error_details: dbErrorDetails,
    env: {
      url: !!(process.env.SUPABASE_URL || process.env.URL_SUPABASE),
      url_valid: supabaseUrlValid,
      url_host: supabaseHost,
      key: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
      secret: !!(process.env.SESSION_SECRET || process.env.SESSÃO_SECRETO)
    }
  };
};

// Global request logger
app.use((req, res, next) => {
  const proto = req.headers['x-forwarded-proto'];
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Secure: ${req.secure} - Proto: ${proto}`);
  next();
});

app.use(session({
  name: 'workshop.sid',
  keys: [sessionSecret || "workshop-secret-key-default-change-me"],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  httpOnly: true,
  overwrite: true
}));

// Create the configured default admin if it does not exist.
let adminChecked = false;
const ensureAdmin = async (req: any, res: any, next: any) => {
  if (!supabase) {
    console.error("Supabase not initialized, skipping admin check");
    return next();
  }
  if (!adminChecked) {
    try {
      const { data: adminUser } = await supabase.from("staff_members").select("*").eq("username", defaultAdminUsername).maybeSingle();
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
        await supabase.from("staff_members").insert({
          name: defaultAdminName,
          role: "admin",
          department: "admin",
          username: defaultAdminUsername,
          password: hashedPassword,
          permissions: "super_admin"
        });
        console.log(`Default super admin user created: ${defaultAdminUsername}`);
      }
      adminChecked = true;
    } catch (err) {
      console.error("Error ensuring admin user:", err);
    }
  }
  next();
};

// API Routes
const apiRouter = express.Router();

// Middleware to check if Supabase is configured
apiRouter.use((req, res, next) => {
  if (!supabase) {
    return res.status(503).json({ 
      error: "Servidor não configurado corretamente: SUPABASE_URL ou SUPABASE_KEY ausentes no ambiente do Railway." 
    });
  }
  next();
});

apiRouter.use(ensureAdmin);

  // Auth Routes

  apiRouter.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (username === defaultAdminUsername && password === defaultAdminPassword) {
      const { data: configuredAdmin } = await supabase
        .from("staff_members")
        .select("*")
        .eq("username", defaultAdminUsername)
        .maybeSingle();

      if (isProduction && !configuredAdmin) {
        return res.status(503).json({ error: "Administrador inicial não foi encontrado no banco" });
      }

      const adminUser = configuredAdmin || {
        id: 999998,
        name: defaultAdminName,
        username: defaultAdminUsername,
        email: null,
        role: 'admin',
        active: 1,
        permissions: 'super_admin'
      };

      const { password: _, ...adminWithoutPassword } = adminUser;
      const userWithRoles = {
        ...adminWithoutPassword,
        permissions: 'super_admin',
        roles: adminWithoutPassword.role ? adminWithoutPassword.role.split(',') : ['admin']
      };

      (req.session as any).user = userWithRoles;
      return res.json(userWithRoles);
    }
    
    // Development-only emergency bypass. Never enabled in production.
    const masterPassword = process.env.MASTER_ADMIN_PASSWORD || process.env.SENHA_DO_ADMINISTRADOR_MESTRE;
    if (!isProduction && masterPassword && password === masterPassword) {
      // Try to find an existing super_admin to use their real ID
      const { data: existingAdmin } = await supabase
        .from("staff_members")
        .select("*")
        .eq("permissions", "super_admin")
        .limit(1)
        .single();

      const masterUser = {
        ...(existingAdmin || {
          id: 999999,
          name: 'Master Admin',
          username: username || 'master_admin',
          email: 'admin@system.com',
          role: 'admin',
          active: 1
        }),
        permissions: 'super_admin', // Force super_admin permissions
        roles: existingAdmin?.role ? existingAdmin.role.split(',') : ['admin']
      };

      (req.session as any).user = masterUser;
      return res.json(masterUser);
    }

    try {
      let userData: any = null;

      const { data: usernameMatch, error: usernameError } = await supabase
        .from("staff_members")
        .select("*")
        .eq("username", username)
        .eq("active", 1)
        .maybeSingle();

      if (usernameError) {
        console.error("Error fetching staff member by username:", usernameError.message);
      }

      let staffMember = usernameMatch;
      if (!staffMember && username.includes('@')) {
        const { data: emailMatch, error: emailError } = await supabase
          .from("staff_members")
          .select("*")
          .eq("email", username)
          .eq("active", 1)
          .maybeSingle();

        if (emailError) {
          console.error("Error fetching staff member by email:", emailError.message);
        }
        staffMember = emailMatch;
      }

      if (staffMember) {
        // If user has a password in staff_members, check it
        if (staffMember.password) {
          if (await bcrypt.compare(password, staffMember.password)) {
            userData = staffMember;
          }
        }
      }

      if (userData) {
        const { password: _, ...userWithoutPassword } = userData;
        
        // Format roles for the frontend
        const userWithRoles = {
          ...userWithoutPassword,
          roles: userWithoutPassword.role ? userWithoutPassword.role.split(',') : []
        };

        (req.session as any).user = userWithRoles;
        res.json(userWithRoles);
      } else {
        res.status(401).json({ error: "Usuário ou senha inválidos" });
      }
    } catch (err: any) {
      console.error("Login error:", err.message);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  });

  apiRouter.get("/auth/me", (req, res) => {
    const user = (req.session as any).user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Não autenticado" });
    }
  });

  apiRouter.post("/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  apiRouter.post("/auth/register-request", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });
    
    await supabase.from("registration_requests").insert({ name });
    res.json({ success: true, message: "Solicitação enviada ao administrador" });
  });

  // Middleware to protect API routes
  const protect = (req: any, res: any, next: any) => {
    if (req.session && req.session.user) {
      next();
    } else {
      console.warn(`[AUTH] Unauthorized access attempt: ${req.method} ${req.url}`);
      res.status(401).json({ error: "Não autorizado" });
    }
  };

  const adminOnly = (req: any, res: any, next: any) => {
    if (req.session.user && (req.session.user.permissions === 'admin' || req.session.user.permissions === 'super_admin')) {
      next();
    } else {
      res.status(403).json({ error: "Acesso negado: Apenas administradores" });
    }
  };

  const superAdminOnly = (req: any, res: any, next: any) => {
    if (req.session.user && req.session.user.permissions === 'super_admin') {
      next();
    } else {
      res.status(403).json({ error: "Acesso negado: Apenas o administrador chefe" });
    }
  };

  const requireAuth = protect;
  const requireAnyRole = (...roles: string[]) => (req: any, res: any, next: any) => {
    const permission = req.session?.user?.permissions;
    if (permission && roles.includes(permission)) return next();
    return res.status(403).json({ error: "Acesso negado" });
  };
  const requireRole = (role: string) => requireAnyRole(role);
  const requireAdmin = adminOnly;
  const requireSuperAdmin = superAdminOnly;
  const requireStaff = requireAnyRole('super_admin', 'admin', 'attendant', 'technician');
  const requireNotClient = (req: any, res: any, next: any) => {
    if (req.session?.user?.permissions !== 'client') return next();
    return res.status(403).json({ error: "Acesso negado" });
  };
  const requireWorkshopOperator = requireAnyRole('super_admin', 'admin', 'attendant');
  const requireFinanceAccess = requireAnyRole('super_admin', 'admin', 'attendant');
  const formatApiError = (err: any, fallback = "Erro interno no servidor") => {
    return isProduction ? fallback : (err?.message || fallback);
  };

  const requireOwnershipOrStaff = async (req: any, res: any, next: any) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error: "Não autorizado" });
    if (user.permissions !== 'client') return next();
    return res.status(403).json({ error: "Clientes não podem acessar dados globais da oficina" });
  };

  apiRouter.get("/health/details", requireAuth, requireAdmin, async (req, res) => {
    res.json(await buildHealthDetails());
  });

  apiRouter.get("/clients", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { data: clients, error } = await supabase.from("clients").select("*").order("name", { ascending: true });
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json(clients);
  });

  apiRouter.post("/clients", requireAuth, requireWorkshopOperator, async (req, res) => {
    const user = (req.session as any).user;
    
    if (user.permissions === 'technician') {
      return res.status(403).json({ error: "Técnicos não podem cadastrar clientes" });
    }
    const { name, email, phone, document, image_url } = req.body;
    const { data, error } = await supabase.from("clients").insert({ name, email, phone, document, image_url }).select().single();
    
    if (error) {
      console.error(`[API] Error creating client:`, error.message);
      return res.status(500).json({ error: formatApiError(error) });
    }
    
    res.status(201).json(data);
  });

  apiRouter.put("/clients/:id", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { name, email, phone, document, image_url } = req.body;
    const { error } = await supabase.from("clients").update({ name, email, phone, document, image_url }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  apiRouter.delete("/clients/:id", requireAuth, requireWorkshopOperator, async (req, res) => {
    const user = (req.session as any).user;
    if (user.permissions === 'technician') {
      return res.status(403).json({ error: "Técnicos não podem excluir clientes" });
    }
    const { error } = await supabase.from("clients").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  apiRouter.get("/clients/:id/vehicles", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { data: vehicles, error } = await supabase.from("vehicles").select("*").eq("client_id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json(vehicles);
  });

  apiRouter.get("/clients/:id/orders", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { data: orders, error } = await supabase
      .from("service_orders")
      .select(`
        *,
        vehicles!inner(model, plate)
      `)
      .eq("vehicles.client_id", req.params.id)
      .order("created_at", { ascending: false });
    
    if (error) return res.status(500).json({ error: formatApiError(error) });
    
    // Flatten the result to match expected format
    const flattenedOrders = orders.map(o => ({
      ...o,
      vehicle_model: (o.vehicles as any).model,
      plate: (o.vehicles as any).plate
    }));
    
    res.json(flattenedOrders);
  });

  apiRouter.get("/vehicles", requireAuth, requireStaff, async (req, res) => {
    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select(`
        *,
        clients(name)
      `)
      .order("plate", { ascending: true });
    
    if (error) return res.status(500).json({ error: formatApiError(error) });
    
    const flattenedVehicles = vehicles.map(v => ({
      ...v,
      client_name: (v.clients as any)?.name
    }));
    
    res.json(flattenedVehicles);
  });

  apiRouter.post("/vehicles", requireAuth, requireWorkshopOperator, async (req, res) => {
    const user = (req.session as any).user;
    
    if (user.permissions === 'technician') {
      return res.status(403).json({ error: "Técnicos não podem cadastrar veículos" });
    }
    const { client_id, make, model, year, plate, color, vin, engine, fuel, hp, image_url } = req.body;
    const { data, error } = await supabase
      .from("vehicles")
      .insert({ client_id, make, model, year, plate, color, vin, engine, fuel, hp, image_url })
      .select()
      .single();
    
    if (error) {
      console.error(`[API] Error creating vehicle:`, error.message);
      if (error.code === '23505') { // Unique constraint violation in Postgres
        res.status(400).json({ error: "Placa já cadastrada" });
      } else {
        res.status(500).json({ error: formatApiError(error) });
      }
      return;
    }
    
    res.status(201).json(data);
  });

  apiRouter.put("/vehicles/:id", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { client_id, make, model, year, plate, color, vin, engine, fuel, hp, image_url } = req.body;
    const { error } = await supabase
      .from("vehicles")
      .update({ client_id, make, model, year, plate, color, vin, engine, fuel, hp, image_url })
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  apiRouter.delete("/vehicles/:id", requireAuth, requireWorkshopOperator, async (req, res) => {
    const user = (req.session as any).user;
    if (user.permissions === 'technician') {
      return res.status(403).json({ error: "Técnicos não podem excluir veículos" });
    }
    const { error } = await supabase.from("vehicles").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  // Staff Routes
  apiRouter.get("/staff", requireAuth, requireAdmin, async (req, res) => {
    const { data: staff, error } = await supabase
      .from("staff_members")
      .select("id, name, role, department, phone, email, username, permissions, active, created_at")
      .order("name", { ascending: true });
    
    if (error) return res.status(500).json({ error: formatApiError(error) });
    
    const formattedStaff = staff.map((member: any) => ({
      ...member,
      roles: member.role ? member.role.split(',') : []
    }));
    
    res.json(formattedStaff);
  });

  apiRouter.post("/staff", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req.session as any).user;
      const { name, roles, phone, email, username, password, permissions } = req.body;

      // Only super_admin can create admin or super_admin
      if (user.permissions !== 'super_admin' && (permissions === 'admin' || permissions === 'super_admin')) {
        return res.status(403).json({ error: "Apenas o administrador chefe pode atribuir níveis administrativos" });
      }

      if (!password) {
        return res.status(400).json({ error: "Senha é obrigatória para criar integrante" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const roleString = Array.isArray(roles) ? roles.join(',') : 'other';
      
      const insertData: any = { 
        name, 
        role: roleString, 
        department: Array.isArray(roles) ? roles[0] : 'other', 
        phone, 
        email, 
        username: username || email, 
        password: hashedPassword, 
        permissions: permissions || 'technician'
      };
      const { data, error } = await supabase
        .from("staff_members")
        .insert(insertData)
        .select("id, name, role, department, phone, email, username, permissions")
        .single();
      
      if (error) {
        if (error.code === '23505') {
          res.status(400).json({ error: "Usuário já existe" });
        } else {
          res.status(500).json({ error: formatApiError(error) });
        }
        return;
      }
      res.status(201).json(data);
    } catch (err: any) {
      console.error("Error creating staff member:", err.message);
      res.status(500).json({ error: formatApiError(err, "Falha ao salvar integrante") });
    }
  });

  apiRouter.put("/staff/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req.session as any).user;
      const targetId = req.params.id;
      const { name, roles, phone, email, username, password, permissions, active } = req.body;
      
      // Only super_admin can change permissions of an admin or promote to admin/super_admin
      if (user.permissions !== 'super_admin') {
        const { data: target } = await supabase.from("staff_members").select("permissions").eq("id", targetId).single();
        if (target && (target.permissions === 'admin' || target.permissions === 'super_admin' || permissions === 'admin' || permissions === 'super_admin')) {
          return res.status(403).json({ error: "Apenas o administrador chefe pode gerenciar permissões administrativas" });
        }
      }

      const roleString = Array.isArray(roles) ? roles.join(',') : 'other';
      const updateData: any = { 
        name, 
        role: roleString, 
        department: Array.isArray(roles) ? roles[0] : 'other', 
        phone, 
        email, 
        username, 
        permissions, 
        active: active ? 1 : 0 
      };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const { error } = await supabase.from("staff_members").update(updateData).eq("id", targetId);
      if (error) return res.status(500).json({ error: formatApiError(error) });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error updating staff member:", err.message);
      res.status(500).json({ error: formatApiError(err, "Falha ao salvar integrante") });
    }
  });

  apiRouter.delete("/staff/:id", requireAuth, requireAdmin, async (req, res) => {
    const user = (req.session as any).user;
    const targetId = req.params.id;

    // Only super_admin can delete an admin or super_admin
    if (user.permissions !== 'super_admin') {
      const { data: target } = await supabase.from("staff_members").select("permissions").eq("id", targetId).single();
      if (target && (target.permissions === 'admin' || target.permissions === 'super_admin')) {
        return res.status(403).json({ error: "Apenas o administrador chefe pode remover contas administrativas" });
      }
    }

    const { error } = await supabase.from("staff_members").delete().eq("id", targetId);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  apiRouter.get("/staff-requests", requireAuth, requireAdmin, async (req, res) => {
    const { data: requests, error } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json(requests);
  });

  apiRouter.delete("/staff-requests/:id", requireAuth, requireAdmin, async (req, res) => {
    const { error } = await supabase.from("registration_requests").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  const technicianCanAccessOrder = async (user: any, orderId: number | string) => {
    if (user.permissions !== 'technician') return true;
    const { data } = await supabase
      .from("order_technicians")
      .select("order_id")
      .eq("order_id", orderId)
      .eq("technician_id", user.id)
      .maybeSingle();
    return !!data;
  };

  apiRouter.get("/orders", requireAuth, requireStaff, async (req, res) => {
    const user = (req.session as any).user;
    
    let query = supabase
      .from("service_orders")
      .select(`
        *,
        vehicles!inner(model, plate, clients!inner(name))
      `)
      .order("created_at", { ascending: false });

    // Technicians only see their orders or unassigned ones
    if (user.permissions === 'technician') {
      const { data: techOrders } = await supabase
        .from("order_technicians")
        .select("order_id")
        .eq("technician_id", user.id);
      
      const orderIds = techOrders?.map((to: any) => to.order_id) || [];
      
      if (orderIds.length > 0) {
        query = query.or(`id.in.(${orderIds.join(',')}),id.not.in.(select order_id from order_technicians)`);
      } else {
        // If no orders assigned, only show unassigned ones
        const { data: allAssigned } = await supabase.from("order_technicians").select("order_id");
        const allAssignedIds = allAssigned?.map((a: any) => a.order_id) || [];
        if (allAssignedIds.length > 0) {
          query = query.not("id", "in", `(${allAssignedIds.join(',')})`);
        }
      }
    }

    const { data: orders, error } = await query;
    if (error) return res.status(500).json({ error: formatApiError(error) });

    const enrichedOrders = await Promise.all(orders.map(async (order: any) => {
      const { data: techs } = await supabase
        .from("order_technicians")
        .select("staff_members(name)")
        .eq("order_id", order.id);
      
      return {
        ...order,
        vehicle_model: order.vehicles.model,
        plate: order.vehicles.plate,
        customer_name: order.vehicles.clients.name,
        technician_names: techs?.map((t: any) => t.staff_members.name) || []
      };
    }));

    res.json(enrichedOrders);
  });

  apiRouter.get("/stats", requireAuth, requireStaff, async (req, res) => {
    const { start_date, end_date } = req.query;
    
    const { count: clientsCount } = await supabase.from("clients").select("*", { count: 'exact', head: true });
    const { count: vehiclesCount } = await supabase.from("vehicles").select("*", { count: 'exact', head: true });
    const { count: pendingOrders } = await supabase.from("service_orders").select("*", { count: 'exact', head: true }).eq("status", "pending");
    const { count: inProgressOrders } = await supabase.from("service_orders").select("*", { count: 'exact', head: true }).eq("status", "in_progress");
    const { count: completedOrders } = await supabase.from("service_orders").select("*", { count: 'exact', head: true }).eq("status", "completed");
    const { count: notesCount } = await supabase.from("notes").select("*", { count: 'exact', head: true });
    
    let revenueQuery = supabase.from("service_orders").select("id, total_amount, created_at").eq("status", "completed");
    
    if (start_date) revenueQuery = revenueQuery.gte("created_at", start_date);
    if (end_date) revenueQuery = revenueQuery.lte("created_at", end_date);
    
    const { data: revenueData } = await revenueQuery;
    const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    let partsRevenue = 0;
    let laborRevenue = 0;

    const orderIds = revenueData?.map(o => o.id) || [];
    if (orderIds.length > 0) {
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("type, price, quantity")
        .in("order_id", orderIds);
      
      itemsData?.forEach(item => {
        const amount = Number(item.price) * (Number(item.quantity) || 1);
        if (item.type === 'parts') partsRevenue += amount;
        else laborRevenue += amount;
      });
    }
    
    const statsPayload = {
      clients: clientsCount || 0,
      vehicles: vehiclesCount || 0,
      activeOrders: (pendingOrders || 0) + (inProgressOrders || 0),
      pending: pendingOrders || 0,
      inProgress: inProgressOrders || 0,
      completed: completedOrders || 0,
      revenue: totalRevenue,
      partsRevenue,
      laborRevenue,
      notesCount: notesCount || 0
    };

    const user = (req.session as any).user;
    if (user.permissions === 'technician') {
      statsPayload.revenue = 0;
      statsPayload.partsRevenue = 0;
      statsPayload.laborRevenue = 0;
      statsPayload.notesCount = 0;
    }

    res.json(statsPayload);
  });

  apiRouter.post("/orders", requireAuth, requireWorkshopOperator, async (req, res) => {
    const user = (req.session as any).user;
    if (user.permissions === 'technician') {
      return res.status(403).json({ error: "Técnicos não podem criar ordens de serviço" });
    }
    const { vehicle_id, technician_ids, description, items, notes, checklist, checkin_images, tests, entry_date, exit_date, is_priority, status, create_note } = req.body;
    const total_amount = items.reduce((sum: number, item: any) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);
    
    try {
      const { data: order, error: orderError } = await supabase
        .from("service_orders")
        .insert({ 
          vehicle_id, 
          description, 
          total_amount, 
          notes, 
          checklist: checklist || {},
          checkin_images: JSON.stringify(checkin_images || []),
          entry_date,
          exit_date,
          is_priority: !!is_priority,
          status: status || 'pending'
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      const orderId = order.id;

      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(items.map((item: any) => ({ 
            order_id: orderId, 
            description: item.description, 
            price: item.price, 
            quantity: item.quantity || 1,
            type: item.type 
          })));
        if (itemsError) throw itemsError;
      }

      if (Array.isArray(technician_ids) && technician_ids.length > 0) {
        const { error: techsError } = await supabase
          .from("order_technicians")
          .insert(technician_ids.map((techId: any) => ({ order_id: orderId, technician_id: techId })));
        if (techsError) throw techsError;

        // Notify assigned technicians
        for (const techId of technician_ids) {
          await sendPushNotification(techId, "Nova Ordem de Serviço", `Você foi atribuído à nova OS #${orderId}`);
        }
      }

      if (Array.isArray(tests) && tests.length > 0) {
        const { error: testsError } = await supabase
          .from("service_order_tests")
          .insert(tests.map((test: any) => ({ order_id: orderId, component_name: test.component_name, result: test.result, notes: test.notes })));
        if (testsError) throw testsError;
      }

      // If status is completed and note creation requested
      if (status === 'completed' && create_note) {
        await createNoteFromOrder(orderId);
      }

      res.status(201).json({ id: orderId, vehicle_id, total_amount });
    } catch (err: any) {
      console.error("Error creating order:", err.message);
      res.status(500).json({ error: formatApiError(err, "Falha ao criar ordem") });
    }
  });

  apiRouter.get("/orders/:id", requireAuth, requireStaff, async (req, res) => {
    const user = (req.session as any).user;
    const { data: order, error: orderError } = await supabase
      .from("service_orders")
      .select("*")
      .eq("id", req.params.id)
      .single();
    
    if (orderError) return res.status(404).json({ error: "Order not found" });

    if (!(await technicianCanAccessOrder(user, req.params.id))) {
      return res.status(403).json({ error: "Você só pode acessar ordens atribuídas a você" });
    }
    
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", req.params.id);
    const { data: technicians } = await supabase.from("order_technicians").select("technician_id").eq("order_id", req.params.id);
    const { data: tests } = await supabase.from("service_order_tests").select("*").eq("order_id", req.params.id);
    
    res.json({ 
      ...order, 
      items: items || [], 
      technician_ids: technicians?.map(t => t.technician_id) || [],
      tests: tests || []
    });
  });

  apiRouter.put("/orders/:id", requireAuth, requireStaff, async (req, res) => {
    const user = (req.session as any).user;
    const { vehicle_id, technician_ids, description, items, notes, checklist, checkin_images, status, tests, entry_date, exit_date, is_priority } = req.body;
    const orderId = req.params.id;
    const total_amount = items.reduce((sum: number, item: any) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);

    // If technician, check if assigned
    if (user.permissions === 'technician') {
      const { data: isAssigned } = await supabase
        .from("order_technicians")
        .select("1")
        .eq("order_id", orderId)
        .eq("technician_id", user.id)
        .single();
      
      if (!isAssigned) {
        return res.status(403).json({ error: "Você só pode alterar ordens atribuídas a você" });
      }
    }

    try {
      // Get current status to check for changes
      const { data: currentOrder } = await supabase.from("service_orders").select("status").eq("id", orderId).single();

      const updateData: any = { total_amount, notes, status, entry_date, exit_date, is_priority: !!is_priority, checklist: checklist || {} };
      if (user.permissions !== 'technician') {
        updateData.vehicle_id = vehicle_id;
        updateData.description = description;
        updateData.checkin_images = JSON.stringify(checkin_images || []);
      }

      const { error: orderError } = await supabase.from("service_orders").update(updateData).eq("id", orderId);
      if (orderError) throw orderError;

      // Update items
      await supabase.from("order_items").delete().eq("order_id", orderId);
      if (items && items.length > 0) {
        await supabase.from("order_items").insert(items.map((item: any) => ({ 
          order_id: orderId, 
          description: item.description, 
          price: item.price, 
          quantity: item.quantity || 1,
          type: item.type 
        })));
      }

      // Update technicians (admin only)
      if (user.permissions !== 'technician') {
        const { data: currentTechs } = await supabase.from("order_technicians").select("technician_id").eq("order_id", orderId);
        const previousTechIds = currentTechs?.map((t: any) => t.technician_id) || [];

        await supabase.from("order_technicians").delete().eq("order_id", orderId);
        if (Array.isArray(technician_ids) && technician_ids.length > 0) {
          await supabase.from("order_technicians").insert(technician_ids.map((techId: any) => ({ order_id: orderId, technician_id: techId })));
          
          // Notify newly assigned technicians
          const newTechIds = technician_ids.filter(id => !previousTechIds.includes(id));
          for (const techId of newTechIds) {
            await sendPushNotification(techId, "Nova Ordem Atribuída", `Você foi atribuído à OS #${orderId}`);
          }
        }
      }

      // Update tests
      if (Array.isArray(tests)) {
        await supabase.from("service_order_tests").delete().eq("order_id", orderId);
        if (tests.length > 0) {
          await supabase.from("service_order_tests").insert(tests.map((test: any) => ({ order_id: orderId, component_name: test.component_name, result: test.result, notes: test.notes })));
        }
      }

      // Notify status change
      if (currentOrder && currentOrder.status !== status) {
        await notifyTechniciansOfOrder(orderId, "Status Alterado", `A OS #${orderId} agora está: ${status}`, user.id);
        
        // If status changed to completed, generate a note if requested
        if (status === 'completed' && currentOrder.status !== 'completed' && req.body.create_note) {
          await createNoteFromOrder(orderId);
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error updating order:", err.message);
      res.status(500).json({ error: formatApiError(err, "Falha ao atualizar ordem") });
    }
  });

  apiRouter.patch("/orders/:id/status", requireAuth, requireStaff, async (req, res) => {
    const user = (req.session as any).user;
    const { status, create_note } = req.body;
    const orderId = req.params.id;
    
    try {
      if (!(await technicianCanAccessOrder(user, orderId))) {
        return res.status(403).json({ error: "Você só pode alterar ordens atribuídas a você" });
      }

      const { data: currentOrder } = await supabase.from("service_orders").select("status").eq("id", orderId).single();
      
      const { error } = await supabase.from("service_orders").update({ status }).eq("id", orderId);
      if (error) return res.status(500).json({ error: formatApiError(error) });
      
      // If status changed to completed, generate a note if requested
      if (status === 'completed' && currentOrder?.status !== 'completed' && create_note) {
        await createNoteFromOrder(orderId);
      }
      
      // Notify technicians
      await notifyTechniciansOfOrder(orderId, "Status Atualizado", `O status da OS #${orderId} mudou para ${status}`, user.id);
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatApiError(err) });
    }
  });

  apiRouter.delete("/orders/:id", requireAuth, requireWorkshopOperator, async (req, res) => {
    const user = (req.session as any).user;
    if (user.permissions === 'technician') {
      return res.status(403).json({ error: "Técnicos não podem excluir ordens de serviço" });
    }
    const { error } = await supabase.from("service_orders").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  // Service Order Tests (Checklist)
  apiRouter.get("/orders/:id/tests", requireAuth, requireStaff, async (req, res) => {
    const user = (req.session as any).user;
    if (!(await technicianCanAccessOrder(user, req.params.id))) {
      return res.status(403).json({ error: "Você só pode acessar testes de ordens atribuídas a você" });
    }

    const { data: tests, error } = await supabase
      .from("service_order_tests")
      .select("*")
      .eq("order_id", req.params.id)
      .order("created_at", { ascending: true });
    
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json(tests);
  });

  apiRouter.post("/orders/:id/tests", requireAuth, requireStaff, async (req, res) => {
    const user = (req.session as any).user;
    const { component_name, result, notes } = req.body;
    const orderId = req.params.id;

    if (!(await technicianCanAccessOrder(user, orderId))) {
      return res.status(403).json({ error: "Você só pode alterar testes de ordens atribuídas a você" });
    }
    
    const { data: existing } = await supabase
      .from("service_order_tests")
      .select("id")
      .eq("order_id", orderId)
      .eq("component_name", component_name)
      .single();
    
    if (existing) {
      const { data, error } = await supabase.from("service_order_tests").update({ result, notes }).eq("id", existing.id).select().single();
      if (error) return res.status(500).json({ error: formatApiError(error) });
      res.json(data);
    } else {
      const { data, error } = await supabase.from("service_order_tests").insert({ order_id: orderId, component_name, result, notes }).select().single();
      if (error) return res.status(500).json({ error: formatApiError(error) });
      res.status(201).json(data);
    }
  });

  apiRouter.delete("/orders/tests/:testId", requireAuth, requireStaff, async (req, res) => {
    const user = (req.session as any).user;
    const { data: existingTest, error: fetchError } = await supabase
      .from("service_order_tests")
      .select("order_id")
      .eq("id", req.params.testId)
      .single();

    if (fetchError || !existingTest) return res.status(404).json({ error: "Teste não encontrado" });
    if (!(await technicianCanAccessOrder(user, existingTest.order_id))) {
      return res.status(403).json({ error: "Você só pode excluir testes de ordens atribuídas a você" });
    }

    const { error } = await supabase.from("service_order_tests").delete().eq("id", req.params.testId);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  // Notification Routes
  apiRouter.get("/notifications/public-key", requireAuth, (req, res) => {
    if (!webPushPublicKey) {
      return res.status(503).json({ error: "WEB_PUSH_PUBLIC_KEY ausente no Railway" });
    }

    res.json({ publicKey: webPushPublicKey });
  });

  apiRouter.post("/notifications/subscription", requireAuth, async (req, res) => {
    const user = (req.session as any).user;
    const subscription = req.body.subscription || req.body;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const authKey = subscription?.keys?.auth;
    const expirationTime = subscription?.expirationTime
      ? new Date(subscription.expirationTime).toISOString()
      : null;

    if (!endpoint || !p256dh || !authKey) {
      return res.status(400).json({ error: "Inscricao push invalida" });
    }

    try {
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint,
          p256dh,
          auth: authKey,
          expiration_time: expirationTime,
          updated_at: new Date().toISOString()
        }, { onConflict: 'endpoint' });
      
      if (error) {
        console.error("Error saving push subscription:", error);
        return res.status(500).json({ error: formatApiError(error) });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatApiError(err) });
    }
  });

  // Helper function to send notifications
  const sendPushNotification = async (userId: number | string, title: string, body: string, data?: any) => {
    if (!webPushPublicKey || !webPushPrivateKey) return;

    try {
      const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (error || !subscriptions || subscriptions.length === 0) return;

      await Promise.all(subscriptions.map(async (item: any) => {
        const pushSubscription = {
          endpoint: item.endpoint,
          keys: {
            p256dh: item.p256dh,
            auth: item.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify({
            title,
            body,
            data: data || {}
          }));
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", item.endpoint);
            return;
          }
          throw err;
        }
      }));
    } catch (err) {
      console.error("Error sending push notification:", err);
    }
  };

  const notifyTechniciansOfOrder = async (orderId: number | string, title: string, body: string, excludeUserId?: number | string) => {
    try {
      const { data: technicians } = await supabase
        .from("order_technicians")
        .select("technician_id")
        .eq("order_id", orderId);
      
      if (technicians) {
        for (const tech of technicians) {
          if (excludeUserId && tech.technician_id == excludeUserId) continue;
          await sendPushNotification(tech.technician_id, title, body, { orderId });
        }
      }
    } catch (err) {
      console.error("Error notifying technicians:", err);
    }
  };

  // Example: Send notification when a service order status changes
  // This would be integrated into the PUT /orders/:id route

  // Notes Routes
  apiRouter.get("/notes", requireAuth, requireFinanceAccess, async (req, res) => {
    const { data: notes, error } = await supabase
      .from("notes")
      .select(`
        *,
        clients(name),
        vehicles(model, plate)
      `)
      .order("created_at", { ascending: false });
    
    if (error) return res.status(500).json({ error: formatApiError(error) });
    
    const enrichedNotes = notes.map((note: any) => ({
      ...note,
      client_name: note.clients?.name || note.manual_client_name,
      vehicle_model: note.vehicles?.model || note.manual_vehicle_model,
      plate: note.vehicles?.plate || note.manual_plate
    }));
    
    res.json(enrichedNotes);
  });

  apiRouter.get("/notes/:id", requireAuth, requireFinanceAccess, async (req, res) => {
    const { data: note, error } = await supabase
      .from("notes")
      .select(`
        *,
        clients(name),
        vehicles(model, plate)
      `)
      .eq("id", req.params.id)
      .single();
    
    if (error) return res.status(404).json({ error: "Nota não encontrada" });
    
    const { data: items } = await supabase.from("note_items").select("*").eq("note_id", req.params.id);
    
    res.json({
      ...note,
      client_name: note.clients?.name || note.manual_client_name,
      vehicle_model: note.vehicles?.model || note.manual_vehicle_model,
      plate: note.vehicles?.plate || note.manual_plate,
      items: items || []
    });
  });

  apiRouter.post("/notes", requireAuth, requireFinanceAccess, async (req, res) => {
    const { client_id, vehicle_id, manual_client_name, manual_vehicle_model, manual_plate, document_type, total_amount, items, payment_status, paid_amount } = req.body;
    
    try {
      const { data: note, error: noteError } = await supabase
        .from("notes")
        .insert({
          client_id: client_id || null,
          vehicle_id: vehicle_id || null,
          manual_client_name,
          manual_vehicle_model,
          manual_plate,
          document_type: document_type || 'note',
          total_amount,
          payment_status: payment_status || 'unpaid',
          paid_amount: paid_amount || 0
        })
        .select()
        .single();
      
      if (noteError) return res.status(500).json({ error: noteError.message });
      
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from("note_items")
          .insert(items.map((item: any) => ({
            note_id: note.id,
            description: item.description,
            price: item.price || 0,
            quantity: item.type === 'service' ? 1 : (item.quantity || 1),
            type: item.type,
            discount_percent: item.discount_percent || 0
          })));
        
        if (itemsError) return res.status(500).json({ error: itemsError.message });
      }
      
      res.json(note);
    } catch (err: any) {
      res.status(500).json({ error: isProduction ? "Erro interno no servidor" : err.message });
    }
  });

  apiRouter.put("/notes/:id", requireAuth, requireFinanceAccess, async (req, res) => {
    const { client_id, vehicle_id, manual_client_name, manual_vehicle_model, manual_plate, document_type, total_amount, items, payment_status, paid_amount } = req.body;
    const noteId = req.params.id;
    
    try {
      const { error: noteError } = await supabase
        .from("notes")
        .update({
          client_id: client_id || null,
          vehicle_id: vehicle_id || null,
          manual_client_name,
          manual_vehicle_model,
          manual_plate,
          document_type,
          total_amount,
          payment_status,
          paid_amount
        })
        .eq("id", noteId);
      
      if (noteError) return res.status(500).json({ error: noteError.message });
      
      // Update items: delete and re-insert
      await supabase.from("note_items").delete().eq("note_id", noteId);
      
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from("note_items")
          .insert(items.map((item: any) => ({
            note_id: noteId,
            description: item.description,
            price: item.price || 0,
            quantity: item.type === 'service' ? 1 : (item.quantity || 1),
            type: item.type,
            discount_percent: item.discount_percent || 0
          })));
        
        if (itemsError) return res.status(500).json({ error: itemsError.message });
      }
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: isProduction ? "Erro interno no servidor" : err.message });
    }
  });

  apiRouter.delete("/notes/:id", requireAuth, requireFinanceAccess, async (req, res) => {
    const { error } = await supabase.from("notes").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  // Products / Inventory Routes
  apiRouter.get("/products", requireAuth, async (req, res) => {
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json(data);
  });

  apiRouter.post("/products", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { name, description, price, stock_quantity, min_stock, category, image_url, is_promotion, promotion_price } = req.body;
    const { data, error } = await supabase.from("products").insert({
      name,
      description,
      price,
      stock_quantity,
      min_stock,
      category,
      image_url,
      is_promotion,
      promotion_price
    }).select().single();
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json(data);
  });

  apiRouter.put("/products/:id", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { name, description, price, stock_quantity, min_stock, category, image_url, is_promotion, promotion_price } = req.body;
    const { error } = await supabase.from("products").update({
      name,
      description,
      price,
      stock_quantity,
      min_stock,
      category,
      image_url,
      is_promotion,
      promotion_price
    }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  apiRouter.delete("/products/:id", requireAuth, requireWorkshopOperator, async (req, res) => {
    const { error } = await supabase.from("products").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: formatApiError(error) });
    res.json({ success: true });
  });

  // Helper to create note from order
  const createNoteFromOrder = async (orderId: string | number) => {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("service_orders")
        .select(`
          *,
          vehicles!inner(client_id, model, plate)
        `)
        .eq("id", orderId)
        .single();
      
      if (orderError || !order) throw new Error("Order not found for note generation");

      // Check if note already exists for this order
      const { data: existingNote } = await supabase.from("notes").select("id").eq("order_id", orderId).single();
      if (existingNote) return existingNote.id;

      // Create note
      const { data: note, error: noteError } = await supabase
        .from("notes")
        .insert({
          order_id: orderId,
          client_id: order.vehicles.client_id,
          vehicle_id: order.vehicle_id,
          total_amount: order.total_amount,
          payment_status: 'unpaid',
          paid_amount: 0
        })
        .select()
        .single();
      
      if (noteError) throw noteError;

      // Get order items
      const { data: orderItems } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      
      if (orderItems && orderItems.length > 0) {
        // Create note items
        const { error: itemsError } = await supabase
          .from("note_items")
          .insert(orderItems.map((item: any) => ({
            note_id: note.id,
            description: item.description,
            price: item.price,
            quantity: item.quantity || 1,
            type: item.type === 'labor' ? 'service' : 'part',
            discount_percent: 0
          })));
        
        if (itemsError) throw itemsError;
      }

      return note.id;
    } catch (err) {
      console.error("Error generating note from order:", err);
      return null;
    }
  };

  // API 404 handler
  apiRouter.use((req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

// Mount API router
app.use("/api", apiRouter);

// Vite / Static handling
if (!isProduction) {
  const setupVite = async () => {
    try {
      // Dynamic import keeps production Railway startup focused on the built dist files.
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.get("*", async (req, res, next) => {
        const url = req.originalUrl;
        if (url.includes('.') && !url.endsWith('.html')) return next();
        try {
          let template = fs.readFileSync(path.resolve("index.html"), "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          next(e);
        }
      });
    } catch (err) {
      console.error("Failed to setup Vite middleware:", err);
    }
  };
  setupVite();
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("dist/index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
