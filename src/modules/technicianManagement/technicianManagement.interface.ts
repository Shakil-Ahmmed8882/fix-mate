export interface IUpdateTechnicianProfile {
    skills?: string[];
    experienceYears?: number;
    isAvailable?: boolean;
}

export interface IAvailabilitySlotInput {
    date: string; // "YYYY-MM-DD"
    startTime: string; // 12-hour "HH:mm AM/PM", e.g. "09:00 AM"
    endTime: string; // 12-hour "HH:mm AM/PM", e.g. "05:00 PM"
}

export interface IUpdateAvailability {
    slots: IAvailabilitySlotInput[];
}

export interface ITechnicianBookingQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
}

export interface IUpdateBookingStatus {
    status: "ACCEPTED" | "DECLINED" | "IN_PROGRESS" | "COMPLETED";
}

export interface ICreateService {
    title: string;
    description?: string;
    price: number;
    categoryId: string;
}

export interface IUpdateService {
    title?: string;
    description?: string;
    price?: number;
    categoryId?: string;
    isActive?: boolean;
}
