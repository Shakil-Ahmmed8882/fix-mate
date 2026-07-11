export interface IAdminUserQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    searchTerm?: string;
    role?: string;
}

export interface IUpdateUserStatus {
    activeStatus: "ACTIVE" | "BLOCKED";
}

export interface IAdminBookingQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
}

export interface ICreateCategory {
    name: string;
    description?: string;
}
