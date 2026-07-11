import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import config from "../src/config";

async function seedAdmin() {
    const existing = await prisma.user.findUnique({ where: { email: config.admin_email } });

    if (existing) {
        console.log(`Admin already exists: ${config.admin_email}`);
        return;
    }

    const hashedPassword = await bcrypt.hash(config.admin_password, Number(config.bcrypt_salt_rounds));

    await prisma.user.create({
        data: {
            name: "FixMate Admin",
            email: config.admin_email,
            password: hashedPassword,
            role: "ADMIN",
            profile: { create: {} },
        },
    });

    console.log(`Admin created: ${config.admin_email}`);
}

async function seedSampleData() {
    const category = await prisma.category.upsert({
        where: { name: "Plumbing" },
        update: {},
        create: { name: "Plumbing", description: "Pipe, sink, and drain repair" },
    });

    const technicianEmail = "sam.technician@fixmate.dev";
    const technicianPassword = await bcrypt.hash("Secret123!", Number(config.bcrypt_salt_rounds));

    const technician = await prisma.user.upsert({
        where: { email: technicianEmail },
        update: {},
        create: {
            name: "Sam Technician",
            email: technicianEmail,
            password: technicianPassword,
            phone: "+8801700000001",
            role: "TECHNICIAN",
            profile: { create: {} },
            technicianProfile: {
                create: { skills: ["plumbing", "pipe fitting"], experienceYears: 5 },
            },
        },
    });

    const existingService = await prisma.service.findFirst({
        where: { technicianId: technician.id, title: "Kitchen sink repair" },
    });

    if (!existingService) {
        await prisma.service.create({
            data: {
                title: "Kitchen sink repair",
                description: "Fix leaks, clogs, and faucet issues",
                price: 45.0,
                categoryId: category.id,
                technicianId: technician.id,
            },
        });
    }

    console.log(`Sample technician ready: ${technicianEmail} / Secret123!`);
    console.log(`Sample category ready: ${category.name}`);
}

async function main() {
    await seedAdmin();
    await seedSampleData();
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
