export interface ICreatePayment {
    bookingId: string;
}

export interface IPaymentQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
}
