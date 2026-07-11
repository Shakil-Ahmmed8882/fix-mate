import { Router } from "express";
import { serviceController } from "./service.controller";

const router = Router();

router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getSingleService);

export const serviceRoutes = router;
