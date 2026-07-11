export interface ICreateBooking {
    serviceId: string;
    scheduledAt: string;
    note?: string;
}

export interface IBookingQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
}
