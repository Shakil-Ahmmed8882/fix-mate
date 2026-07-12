// Time / date helpers for availability slots.
//
// The API takes human-readable input (12-hour "09:00 AM", date "YYYY-MM-DD")
// because a technician testing in Postman shouldn't have to do 24-hour mental
// math. Internally we store canonical 24h "HH:mm" strings + a DATE, which sort
// and overlap-compare correctly, and we expand times back into a rich object on
// read so the frontend gets both display text and dropdown values for free.
//
// Plain JS only — the project has no date library, and this doesn't need one.

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type Period = "AM" | "PM";

export interface IRichTime {
    display: string; // "05:00 PM"
    hour: number; // 12-hour clock hour, 1–12
    minute: number; // 0–59
    period: Period;
    time24: string; // "17:00"
}

// "09:00 AM" -> "09:00", "12:00 AM" -> "00:00", "12:00 PM" -> "12:00", "05:30 PM" -> "17:30".
// Assumes the input already passed the 12h regex; guards defensively anyway.
export const parseAmPmTo24 = (input: string): string => {
    const match = /^(0[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/.exec(input.trim());
    if (!match) {
        throw new Error(`Invalid 12-hour time: "${input}"`);
    }
    let hour = Number(match[1]);
    const minute = match[2];
    const period = match[3] as Period;

    if (period === "AM") {
        if (hour === 12) hour = 0;
    } else {
        if (hour !== 12) hour += 12;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
};

// "17:00" -> "05:00 PM", "00:15" -> "12:15 AM", "12:00" -> "12:00 PM".
export const format24ToAmPm = (hhmm: string): string => {
    const [h, m] = hhmm.split(":");
    const hour24 = Number(h);
    const period: Period = hour24 >= 12 ? "PM" : "AM";
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${String(hour12).padStart(2, "0")}:${m} ${period}`;
};

// "17:00" -> { display: "05:00 PM", hour: 5, minute: 0, period: "PM", time24: "17:00" }.
export const buildRichTime = (hhmm: string): IRichTime => {
    const display = format24ToAmPm(hhmm); // "05:00 PM"
    const period = display.slice(-2) as Period;
    const [hourStr, minuteStr] = display.slice(0, 5).split(":") as [string, string];
    return {
        display,
        hour: Number(hourStr),
        minute: Number(minuteStr),
        period,
        time24: hhmm,
    };
};

// A Date (or "YYYY-MM-DD") -> "Aug 15, 2026". Uses UTC parts of the stored
// @db.Date value so the calendar day never shifts under a timezone.
export const formatDateHuman = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

// A stored Date -> "2026-08-15" (calendar day, timezone-safe).
export const formatDateIso = (date: Date): string => {
    return date.toISOString().slice(0, 10);
};

// "Aug 15, 2026 09:00 AM–05:00 PM" — the readable form used in overlap /
// past-date error messages so it's obvious in Postman which slot is which.
export const formatSlotHuman = (date: Date | string, start24: string, end24: string): string => {
    return `${formatDateHuman(date)} ${format24ToAmPm(start24)}–${format24ToAmPm(end24)}`;
};

// Server "today" at 00:00 UTC, for rejecting past-dated slots. Computed at
// runtime — never hardcoded.
export const todayDateOnly = (): Date => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

// Raw AvailabilitySlot row -> the rich output shape both the technician's own
// GET and the public technician read return.
export interface IAvailabilitySlotOutput {
    id: string;
    date: string; // "YYYY-MM-DD"
    startTime: IRichTime;
    endTime: IRichTime;
}

export const toRichSlot = (row: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
}): IAvailabilitySlotOutput => ({
    id: row.id,
    date: formatDateIso(row.date),
    startTime: buildRichTime(row.startTime),
    endTime: buildRichTime(row.endTime),
});
