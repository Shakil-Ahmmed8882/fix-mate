export interface IUpdateTechnicianProfile {
    skills?: string[];
    experienceYears?: number;
    isAvailable?: boolean;
}

export interface IAvailabilitySlotInput {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
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
