import {
  users,
  userProfiles,
  warehouseLayouts,
  warehouseComponents,
  inspections,
  inspectionPhotos,
  reports,
  notifications,
  type User,
  type UpsertUser,
  type UserProfile,
  type WarehouseLayout,
  type WarehouseComponent,
  type Inspection,
  type Report,
  type Notification,
  type InsertUserProfile,
  type InsertWarehouseLayout,
  type InsertWarehouseComponent,
  type InsertInspection,
  type InsertReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Layout operations
  getLayouts(): Promise<WarehouseLayout[]>;
  getLayout(id: string): Promise<WarehouseLayout | undefined>;
  createLayout(layout: InsertWarehouseLayout): Promise<WarehouseLayout>;
  updateLayout(id: string, layout: Partial<InsertWarehouseLayout>): Promise<WarehouseLayout>;
  deleteLayout(id: string): Promise<void>;
  
  // Component operations
  getComponents(layoutId: string): Promise<WarehouseComponent[]>;
  getComponent(id: string): Promise<WarehouseComponent | undefined>;
  createComponent(component: InsertWarehouseComponent): Promise<WarehouseComponent>;
  updateComponent(id: string, component: Partial<InsertWarehouseComponent>): Promise<WarehouseComponent>;
  deleteComponent(id: string): Promise<void>;
  deleteComponentsByLayout(layoutId: string): Promise<void>;
  
  // Inspection operations
  getInspections(componentId?: string): Promise<Inspection[]>;
  getInspection(id: string): Promise<Inspection | undefined>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: string, inspection: Partial<InsertInspection>): Promise<Inspection>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalComponents: number;
    immediateThreats: number;
    fix4Weeks: number;
    monitorOnly: number;
  }>;
  
  getUrgentInspections(): Promise<Inspection[]>;
  getRecentInspections(limit?: number): Promise<Inspection[]>;
  
  // Report operations
  getReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by email
    if (userData.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingUser) {
        // Update existing user
        const [updatedUser] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return updatedUser;
      }
    }
    
    // Create new user
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  async getLayouts(): Promise<WarehouseLayout[]> {
    return await db
      .select()
      .from(warehouseLayouts)
      .where(eq(warehouseLayouts.isActive, true))
      .orderBy(desc(warehouseLayouts.updatedAt));
  }

  async getLayout(id: string): Promise<WarehouseLayout | undefined> {
    const [layout] = await db
      .select()
      .from(warehouseLayouts)
      .where(eq(warehouseLayouts.id, id));
    return layout;
  }

  async createLayout(layout: InsertWarehouseLayout): Promise<WarehouseLayout> {
    const [newLayout] = await db
      .insert(warehouseLayouts)
      .values(layout)
      .returning();
    return newLayout;
  }

  async updateLayout(id: string, layout: Partial<InsertWarehouseLayout>): Promise<WarehouseLayout> {
    const [updatedLayout] = await db
      .update(warehouseLayouts)
      .set({ ...layout, updatedAt: new Date() })
      .where(eq(warehouseLayouts.id, id))
      .returning();
    return updatedLayout;
  }

  async deleteLayout(id: string): Promise<void> {
    await db
      .update(warehouseLayouts)
      .set({ isActive: false })
      .where(eq(warehouseLayouts.id, id));
  }

  async getComponents(layoutId: string): Promise<WarehouseComponent[]> {
    return await db
      .select()
      .from(warehouseComponents)
      .where(eq(warehouseComponents.layoutId, layoutId))
      .orderBy(warehouseComponents.id);
  }

  async getComponent(id: string): Promise<WarehouseComponent | undefined> {
    const [component] = await db
      .select()
      .from(warehouseComponents)
      .where(eq(warehouseComponents.id, id));
    return component;
  }

  async createComponent(component: InsertWarehouseComponent): Promise<WarehouseComponent> {
    const [newComponent] = await db
      .insert(warehouseComponents)
      .values(component)
      .returning();
    return newComponent;
  }

  async updateComponent(id: string, component: Partial<InsertWarehouseComponent>): Promise<WarehouseComponent> {
    const [updatedComponent] = await db
      .update(warehouseComponents)
      .set({ ...component, updatedAt: new Date() })
      .where(eq(warehouseComponents.id, id))
      .returning();
    return updatedComponent;
  }

  async deleteComponent(id: string): Promise<void> {
    await db
      .delete(warehouseComponents)
      .where(eq(warehouseComponents.id, id));
  }

  async deleteComponentsByLayout(layoutId: string): Promise<void> {
    await db
      .delete(warehouseComponents)
      .where(eq(warehouseComponents.layoutId, layoutId));
  }

  async getInspections(componentId?: string): Promise<Inspection[]> {
    const query = db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.inspectionDate));

    if (componentId) {
      return await query.where(eq(inspections.componentId, componentId));
    }

    return await query;
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const [inspection] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id));
    return inspection;
  }

  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [newInspection] = await db
      .insert(inspections)
      .values(inspection)
      .returning();
    
    // Update component status based on severity
    const statusMap = {
      red: 'immediate',
      amber: 'fix_4_weeks',
      green: 'monitor'
    } as const;
    
    await db
      .update(warehouseComponents)
      .set({ status: statusMap[inspection.severity] })
      .where(eq(warehouseComponents.id, inspection.componentId));

    return newInspection;
  }

  async updateInspection(id: string, inspection: Partial<InsertInspection>): Promise<Inspection> {
    const [updatedInspection] = await db
      .update(inspections)
      .set(inspection)
      .where(eq(inspections.id, id))
      .returning();
    return updatedInspection;
  }

  async getDashboardStats(): Promise<{
    totalComponents: number;
    immediateThreats: number;
    fix4Weeks: number;
    monitorOnly: number;
  }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(warehouseComponents);

    const [immediateResult] = await db
      .select({ count: count() })
      .from(warehouseComponents)
      .where(eq(warehouseComponents.status, 'immediate'));

    const [fix4WeeksResult] = await db
      .select({ count: count() })
      .from(warehouseComponents)
      .where(eq(warehouseComponents.status, 'fix_4_weeks'));

    const [monitorResult] = await db
      .select({ count: count() })
      .from(warehouseComponents)
      .where(or(
        eq(warehouseComponents.status, 'good'),
        eq(warehouseComponents.status, 'monitor')
      ));

    return {
      totalComponents: totalResult.count,
      immediateThreats: immediateResult.count,
      fix4Weeks: fix4WeeksResult.count,
      monitorOnly: monitorResult.count,
    };
  }

  async getUrgentInspections(): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .where(
        and(
          or(
            eq(inspections.severity, 'red'),
            eq(inspections.severity, 'amber')
          ),
          eq(inspections.isResolved, false)
        )
      )
      .orderBy(inspections.inspectionDate)
      .limit(10);
  }

  async getRecentInspections(limit = 5): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.inspectionDate))
      .limit(limit);
  }

  async getReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.generatedAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
