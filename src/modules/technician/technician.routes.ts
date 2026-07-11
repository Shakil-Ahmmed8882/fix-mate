import { Router } from "express";
import { technicianController } from "./technician.controller";

const router = Router();

router.get("/", technicianController.getAllTechnicians);
router.get("/:id", technicianController.getSingleTechnician);

export const technicianRoutes = router;
