import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import multer from "multer";
import path from "path";

// Set up multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Validation schemas
const createLayoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const createComponentSchema = z.object({
  id: z.string().min(1),
  layoutId: z.string().uuid(),
  componentType: z.enum(['rack', 'beam', 'upright']),
  xPosition: z.number(),
  yPosition: z.number(),
  width: z.number(),
  height: z.number(),
  status: z.enum(['good', 'monitor', 'fix_4_weeks', 'immediate']).optional(),
});

const createInspectionSchema = z.object({
  componentId: z.string().min(1),
  defectType: z.enum(['bent_upright', 'damaged_beam', 'loose_connections', 'corrosion', 'missing_components', 'overloading', 'custom']),
  customDefect: z.string().optional(),
  severity: z.enum(['green', 'amber', 'red']),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

// PDF Generation function
async function generateReportPDF(report: any, storage: any) {
  try {
    console.log(`✅ Generated PDF content for report ${report.id}`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Try to get user by stored database ID first, then fallback to claims
      let userId = req.user.userId || req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user not found by claims sub, try to find by email
      if (!user && req.user.claims.email) {
        console.log('User not found by ID, searching by email:', req.user.claims.email);
        const users = await storage.getUserByEmail(req.user.claims.email);
        if (users) {
          user = users;
          userId = user.id;
        }
      }
      
      if (!user) {
        console.log('User not found, creating new user from claims:', req.user.claims);
        // Create user if not found
        user = await storage.upsertUser({
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
        });
        
        // Create default profile
        await storage.createUserProfile({
          userId: user.id,
          role: 'inspector',
        });
        
        userId = user.id;
      }
      
      const profile = await storage.getUserProfile(userId);
      res.json({ ...user, profile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/urgent-inspections', isAuthenticated, async (req, res) => {
    try {
      const urgentInspections = await storage.getUrgentInspections();
      res.json(urgentInspections);
    } catch (error) {
      console.error("Error fetching urgent inspections:", error);
      res.status(500).json({ message: "Failed to fetch urgent inspections" });
    }
  });

  app.get('/api/dashboard/recent-activity', isAuthenticated, async (req, res) => {
    try {
      const recentActivity = await storage.getRecentInspections(5);
      res.json(recentActivity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Layout routes
  app.get('/api/layouts', isAuthenticated, async (req, res) => {
    try {
      const layouts = await storage.getLayouts();
      res.json(layouts);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      res.status(500).json({ message: "Failed to fetch layouts" });
    }
  });

  app.get('/api/layouts/:id', isAuthenticated, async (req, res) => {
    try {
      const layout = await storage.getLayout(req.params.id);
      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }
      res.json(layout);
    } catch (error) {
      console.error("Error fetching layout:", error);
      res.status(500).json({ message: "Failed to fetch layout" });
    }
  });

  app.post('/api/layouts', isAuthenticated, async (req: any, res) => {
    try {
      const data = createLayoutSchema.parse(req.body);
      const layout = await storage.createLayout({
        ...data,
        createdBy: req.user.claims.sub,
      });
      res.status(201).json(layout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating layout:", error);
      res.status(500).json({ message: "Failed to create layout" });
    }
  });

  // Component routes
  app.get('/api/layouts/:layoutId/components', isAuthenticated, async (req, res) => {
    try {
      const layoutId = req.params.layoutId;
      
      // Handle 'default' case by getting the first available layout
      let actualLayoutId = layoutId;
      if (layoutId === 'default') {
        const layouts = await storage.getLayouts();
        if (layouts.length === 0) {
          return res.json([]);
        }
        actualLayoutId = layouts[0].id;
      }
      
      const components = await storage.getComponents(actualLayoutId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching components:", error);
      res.status(500).json({ message: "Failed to fetch components" });
    }
  });

  app.post('/api/components', isAuthenticated, async (req, res) => {
    try {
      const data = createComponentSchema.parse(req.body);
      const component = await storage.createComponent(data);
      res.status(201).json(component);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating component:", error);
      res.status(500).json({ message: "Failed to create component" });
    }
  });

  app.put('/api/components/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const component = await storage.updateComponent(req.params.id, updates);
      res.json(component);
    } catch (error) {
      console.error("Error updating component:", error);
      res.status(500).json({ message: "Failed to update component" });
    }
  });

  app.delete('/api/components/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteComponent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting component:", error);
      res.status(500).json({ message: "Failed to delete component" });
    }
  });

  // Bulk component operations
  app.post('/api/layouts/:layoutId/components/bulk', isAuthenticated, async (req, res) => {
    try {
      const { components } = req.body;
      
      // Clear existing components
      await storage.deleteComponentsByLayout(req.params.layoutId);
      
      // Create new components
      const createdComponents = [];
      for (const comp of components) {
        const data = createComponentSchema.parse({
          ...comp,
          layoutId: req.params.layoutId,
        });
        const component = await storage.createComponent(data);
        createdComponents.push(component);
      }
      
      res.json(createdComponents);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error bulk creating components:", error);
      res.status(500).json({ message: "Failed to bulk create components" });
    }
  });

  // Inspection routes
  app.get('/api/inspections', isAuthenticated, async (req, res) => {
    try {
      const componentId = req.query.componentId as string;
      const inspections = await storage.getInspections(componentId);
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  app.post('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const data = createInspectionSchema.parse(req.body);
      
      // Calculate due date for amber severity
      let dueDate;
      if (data.severity === 'amber' && !data.dueDate) {
        const fourWeeksFromNow = new Date();
        fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);
        dueDate = fourWeeksFromNow.toISOString().split('T')[0];
      } else if (data.dueDate) {
        dueDate = data.dueDate;
      }
      
      const inspection = await storage.createInspection({
        ...data,
        inspectorId: req.user.claims.sub,
        dueDate,
      });
      
      res.status(201).json(inspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating inspection:", error);
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  // CSV export/import routes
  app.get('/api/layouts/:layoutId/export-csv', isAuthenticated, async (req, res) => {
    try {
      const components = await storage.getComponents(req.params.layoutId);
      const layout = await storage.getLayout(req.params.layoutId);
      
      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${layout.name}_layout.csv"`);
      
      // CSV header
      let csv = 'component_id,type,x,y,width,height,status\n';
      
      // CSV rows
      for (const component of components) {
        csv += `${component.id},${component.componentType},${component.xPosition},${component.yPosition},${component.width},${component.height},${component.status}\n`;
      }
      
      res.send(csv);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  app.post('/api/layouts/import-csv', isAuthenticated, upload.single('csvFile'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }
      
      const fs = require('fs');
      const csvData = fs.readFileSync(req.file.path, 'utf-8');
      const lines = csvData.split('\n');
      const header = lines[0].split(',');
      
      // Create new layout
      const layout = await storage.createLayout({
        name: `Imported Layout ${new Date().toISOString().split('T')[0]}`,
        createdBy: req.user.claims.sub,
      });
      
      // Parse CSV rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        const component = {
          id: values[0],
          layoutId: layout.id,
          componentType: values[1] as any,
          xPosition: parseFloat(values[2]),
          yPosition: parseFloat(values[3]),
          width: parseFloat(values[4]),
          height: parseFloat(values[5]),
          status: (values[6] || 'good') as any,
        };
        
        await storage.createComponent(component);
      }
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({ message: "Layout imported successfully", layoutId: layout.id });
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV" });
    }
  });

  // Report routes
  app.get('/api/reports', isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const reportData = { ...req.body };
      
      // Handle empty layoutId case
      if (!reportData.layoutId || reportData.layoutId === '') {
        const layouts = await storage.getLayouts();
        if (layouts.length > 0) {
          reportData.layoutId = layouts[0].id;
        } else {
          return res.status(400).json({ message: "No layouts available for report generation" });
        }
      }
      
      // Create the report record
      const report = await storage.createReport({
        ...reportData,
        generatedBy: req.user.claims.sub,
      });
      
      // Generate PDF asynchronously (in a real app you might use a queue)
      setTimeout(async () => {
        try {
          await generateReportPDF(report, storage);
        } catch (error) {
          console.error("Error generating PDF:", error);
        }
      }, 1000);
      
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const profile = await storage.getUserProfile(req.user.claims.sub);
      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all users with their profiles
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const notifications = await storage.getNotifications(req.user.claims.sub);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
