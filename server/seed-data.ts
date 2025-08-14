import { storage } from "./storage";

export async function seedSampleData() {
  console.log("🌱 Starting to seed sample data...");

  try {
    // Check if we already have layouts
    const existingLayouts = await storage.getLayouts();
    if (existingLayouts.length > 0) {
      console.log("✅ Sample data already exists, skipping seed");
      return;
    }

    // Create a test user first for development if it doesn't exist
    let testUser = await storage.getUserByEmail('test@example.com');
    if (!testUser) {
      testUser = await storage.upsertUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Inspector',
      });
      
      // Create user profile
      await storage.createUserProfile({
        userId: testUser.id,
        role: 'inspector',
        certificationNumber: 'CERT-2024-001',
      });
      
      console.log("✅ Created test user for development");
    }

    // Create a sample warehouse layout
    const sampleLayout = await storage.createLayout({
      name: "Main Warehouse - Zone A",
      description: "Primary storage area with heavy-duty pallet racking systems",
      createdBy: testUser.id,
    });

    console.log("✅ Created sample layout:", sampleLayout.name);

    // Create sample components for the layout
    const sampleComponents = [
      {
        id: "RACK-001",
        layoutId: sampleLayout.id,
        componentType: "rack" as const,
        xPosition: 100,
        yPosition: 100,
        width: 200,
        height: 300,
        status: "good" as const,
      },
      {
        id: "RACK-002", 
        layoutId: sampleLayout.id,
        componentType: "rack" as const,
        xPosition: 350,
        yPosition: 100,
        width: 200,
        height: 300,
        status: "monitor" as const,
      },
      {
        id: "BEAM-001",
        layoutId: sampleLayout.id,
        componentType: "beam" as const,
        xPosition: 100,
        yPosition: 120,
        width: 180,
        height: 20,
        status: "good" as const,
      },
      {
        id: "BEAM-002",
        layoutId: sampleLayout.id,
        componentType: "beam" as const,
        xPosition: 100,
        yPosition: 180,
        width: 180,
        height: 20,
        status: "fix_4_weeks" as const,
      },
      {
        id: "BEAM-003",
        layoutId: sampleLayout.id,
        componentType: "beam" as const,
        xPosition: 350,
        yPosition: 120,
        width: 180,
        height: 20,
        status: "immediate" as const,
      },
      {
        id: "UPRIGHT-001",
        layoutId: sampleLayout.id,
        componentType: "upright" as const,
        xPosition: 80,
        yPosition: 90,
        width: 20,
        height: 320,
        status: "good" as const,
      },
      {
        id: "UPRIGHT-002",
        layoutId: sampleLayout.id,
        componentType: "upright" as const,
        xPosition: 300,
        yPosition: 90,
        width: 20,
        height: 320,
        status: "good" as const,
      },
    ];

    // Create components
    for (const componentData of sampleComponents) {
      await storage.createComponent(componentData);
    }

    console.log(`✅ Created ${sampleComponents.length} sample components`);

    // Create sample inspection data
    const sampleInspection = await storage.createInspection({
      componentId: "BEAM-002",
      inspectorId: testUser.id,
      defectType: "damaged_beam",
      severity: "amber",
      notes: "Minor damage to beam coating, requires monitoring and repair within 4 weeks",
    });

    const urgentInspection = await storage.createInspection({
      componentId: "BEAM-003", 
      inspectorId: testUser.id,
      defectType: "loose_connections",
      severity: "red",
      notes: "URGENT: Loose bolts detected, immediate repair required for safety",
    });

    console.log("✅ Created sample inspection data");
    console.log("🎉 Sample data seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding sample data:", error);
    throw error;
  }
}