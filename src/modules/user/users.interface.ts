export interface IUser {
    name: string;
    email: string;
    password: string;
    phone?: string;
    profilePhoto?: string;
    // Only CUSTOMER/TECHNICIAN are self-selectable at registration — ADMIN is
    // deliberately excluded so nobody can grant themselves admin through a public endpoint.
    role?: "CUSTOMER" | "TECHNICIAN";
}

export interface IUpdateProfile {
    name?: string;
    phone?: string;
    bio?: string;
    profilePhoto?: string;
    address?: string;
}

export interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
}
