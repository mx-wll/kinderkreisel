import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval("expire reservations", { minutes: 15 }, api.maintenance.expireReservations);
crons.interval("message digest", { hours: 6 }, api.maintenance.sendMessageDigest);

export default crons;
