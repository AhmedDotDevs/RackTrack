import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  real,
  date,
  uuid,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles for role management
export const roleEnum = pgEnum('role', ['inspector', 'admin']);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum("role").notNull().default('inspector'),
  phone: varchar("phone"),
  certificationNumber: varchar("certification_number"),
  certificationExpiry: date("certification_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse layouts
export const warehouseLayouts = pgTable("warehouse_layouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Component types and statuses
export const componentTypeEnum = pgEnum('component_type', ['rack', 'beam', 'upright']);
export const componentStatusEnum = pgEnum('component_status', ['good', 'monitor', 'fix_4_weeks', 'immediate']);

export const warehouseComponents = pgTable("warehouse_components", {
  id: varchar("id", { length: 50 }).primaryKey(),
  layoutId: uuid("layout_id").notNull().references(() => warehouseLayouts.id, { onDelete: 'cascade' }),
  componentType: componentTypeEnum("component_type").notNull(),
  xPosition: real("x_position").notNull(),
  yPosition: real("y_position").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  status: componentStatusEnum("status").default('good'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Defect types and severity levels
export const defectTypeEnum = pgEnum('defect_type', [
  'bent_upright', 'damaged_beam', 'loose_connections', 'corrosion', 'missing_components', 'overloading', 'custom'
]);
export const severityLevelEnum = pgEnum('severity_level', ['green', 'amber', 'red']);

export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  componentId: varchar("component_id", { length: 50 }).notNull().references(() => warehouseComponents.id, { onDelete: 'cascade' }),
  inspectorId: varchar("inspector_id").notNull().references(() => users.id),
  defectType: defectTypeEnum("defect_type").notNull(),
  customDefect: varchar("custom_defect", { length: 255 }),
  severity: severityLevelEnum("severity").notNull(),
  notes: text("notes"),
  inspectionDate: timestamp("inspection_date").defaultNow(),
  dueDate: date("due_date"),
  isResolved: boolean("is_resolved").default(false),
  resolvedDate: timestamp("resolved_date"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
});

// Inspection photos
export const inspectionPhotos = pgTable("inspection_photos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: uuid("inspection_id").notNull().references(() => inspections.id, { onDelete: 'cascade' }),
  imageUrl: varchar("image_url").notNull(),
  caption: varchar("caption", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Reports
export const reportTypeEnum = pgEnum('report_type', ['full', 'defects', 'urgent', 'compliance']);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  layoutId: uuid("layout_id").notNull().references(() => warehouseLayouts.id),
  reportType: reportTypeEnum("report_type").notNull(),
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  pdfUrl: varchar("pdf_url"),
  includeLayout: boolean("include_layout").default(true),
  includePhotos: boolean("include_photos").default(true),
  includeInspectorDetails: boolean("include_inspector_details").default(false),
});

// Notifications
export const notificationTypeEnum = pgEnum('notification_type', ['amber_reminder', 'red_alert', 'overdue']);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  inspectionId: uuid("inspection_id").notNull().references(() => inspections.id),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  createdLayouts: many(warehouseLayouts),
  inspections: many(inspections),
  notifications: many(notifications),
  reports: many(reports),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const warehouseLayoutsRelations = relations(warehouseLayouts, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [warehouseLayouts.createdBy],
    references: [users.id],
  }),
  components: many(warehouseComponents),
  reports: many(reports),
}));

export const warehouseComponentsRelations = relations(warehouseComponents, ({ one, many }) => ({
  layout: one(warehouseLayouts, {
    fields: [warehouseComponents.layoutId],
    references: [warehouseLayouts.id],
  }),
  inspections: many(inspections),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  component: one(warehouseComponents, {
    fields: [inspections.componentId],
    references: [warehouseComponents.id],
  }),
  inspector: one(users, {
    fields: [inspections.inspectorId],
    references: [users.id],
  }),
  resolvedBy: one(users, {
    fields: [inspections.resolvedBy],
    references: [users.id],
  }),
  photos: many(inspectionPhotos),
  notifications: many(notifications),
}));

export const inspectionPhotosRelations = relations(inspectionPhotos, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionPhotos.inspectionId],
    references: [inspections.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  layout: one(warehouseLayouts, {
    fields: [reports.layoutId],
    references: [warehouseLayouts.id],
  }),
  generatedBy: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  inspection: one(inspections, {
    fields: [notifications.inspectionId],
    references: [inspections.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWarehouseLayoutSchema = createInsertSchema(warehouseLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWarehouseComponentSchema = createInsertSchema(warehouseComponents).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  inspectionDate: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type WarehouseLayout = typeof warehouseLayouts.$inferSelect;
export type WarehouseComponent = typeof warehouseComponents.$inferSelect;
export type Inspection = typeof inspections.$inferSelect;
export type InspectionPhoto = typeof inspectionPhotos.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertWarehouseLayout = z.infer<typeof insertWarehouseLayoutSchema>;
export type InsertWarehouseComponent = z.infer<typeof insertWarehouseComponentSchema>;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Enums for frontend use
export const ComponentType = {
  RACK: 'rack' as const,
  BEAM: 'beam' as const,
  UPRIGHT: 'upright' as const,
} as const;

export const ComponentStatus = {
  GOOD: 'good' as const,
  MONITOR: 'monitor' as const,
  FIX_4_WEEKS: 'fix_4_weeks' as const,
  IMMEDIATE: 'immediate' as const,
} as const;

export const DefectType = {
  BENT_UPRIGHT: 'bent_upright' as const,
  DAMAGED_BEAM: 'damaged_beam' as const,
  LOOSE_CONNECTIONS: 'loose_connections' as const,
  CORROSION: 'corrosion' as const,
  MISSING_COMPONENTS: 'missing_components' as const,
  OVERLOADING: 'overloading' as const,
  CUSTOM: 'custom' as const,
} as const;

export const SeverityLevel = {
  GREEN: 'green' as const,
  AMBER: 'amber' as const,
  RED: 'red' as const,
} as const;

export const UserRole = {
  INSPECTOR: 'inspector' as const,
  ADMIN: 'admin' as const,
} as const;
