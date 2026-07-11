import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import config from "../../config/index.js";
import { AppError } from "../../utils/AppError.js";
import type { IUpdatePassword, IUpdateProfile, IUser } from "./users.interface.js";

const registerUserIntoDB = async (userData: IUser) => {
    const { name, email, password, phone, profilePhoto, role } = userData;

    if (role && role !== "CUSTOMER" && role !== "TECHNICIAN") {
        throw new AppError(400, "role must be CUSTOMER or TECHNICIAN");
    }

    const isUserExist = await prisma.user.findUnique({
        where: { email },
    });

    if (isUserExist) {
        throw new AppError(409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

    const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone ?? null,
                role: role ?? "CUSTOMER",
            },
        });

        await tx.profile.create({
            data: {
                userId: createdUser.id,
                profilePhoto: profilePhoto ?? null,
            },
        });

        // A Technician needs a TechnicianProfile to be bookable — created empty here,
        // filled in later via PUT /api/technician/profile.
        if (createdUser.role === "TECHNICIAN") {
            await tx.technicianProfile.create({
                data: { userId: createdUser.id },
            });
        }

        return tx.user.findUniqueOrThrow({
            where: { id: createdUser.id },
            omit: {
                password: true,
            },
            include: {
                profile: true,
                technicianProfile: true,
            },
        });
    });

    return user;
};

const getMyProfileFromDB = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
        omit: {
            password: true,
        },
        include: {
            profile: true,
        },
    });

    if (!user) {
        throw new AppError(404, "User does not exist");
    }

    return user;
};

const updateMyProfileIntoDB = async (email: string, payload: IUpdateProfile) => {
    const { name, phone, bio, profilePhoto, address } = payload;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(404, "User does not exist");
    }

    const profileData: { bio?: string; profilePhoto?: string; address?: string } = {};
    if (bio !== undefined) profileData.bio = bio;
    if (profilePhoto !== undefined) profileData.profilePhoto = profilePhoto;
    if (address !== undefined) profileData.address = address;

    await prisma.$transaction(async (tx) => {
        if (name !== undefined || phone !== undefined) {
            await tx.user.update({
                where: { id: user.id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(phone !== undefined && { phone }),
                },
            });
        }

        if (Object.keys(profileData).length) {
            await tx.profile.update({
                where: { userId: user.id },
                data: profileData,
            });
        }
    });

    const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        omit: {
            password: true,
        },
        include: {
            profile: true,
        },
    });

    return updatedUser;
};

const updateMyPasswordIntoDB = async (email: string, payload: IUpdatePassword) => {
    const { oldPassword, newPassword } = payload;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(404, "User does not exist");
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
        throw new AppError(401, "Old password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    });

    return null;
};

export const UserServices = {
    registerUserIntoDB,
    getMyProfileFromDB,
    updateMyProfileIntoDB,
    updateMyPasswordIntoDB,
};
