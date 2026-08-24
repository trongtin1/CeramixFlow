"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const workflow_controller_1 = require("../controllers/workflow.controller");
const system_controller_1 = require("../controllers/system.controller");
const router = (0, express_1.Router)();
// 1. AI Order Parser
router.post('/orders/parse-ai', order_controller_1.OrderController.parseOrderWithAi);
// 2. Batches CRUD & Workflow
router.post('/batches', order_controller_1.OrderController.createBatch);
router.get('/batches', order_controller_1.OrderController.getAllBatches);
router.get('/batches/:id', order_controller_1.OrderController.getBatchById);
// 3. Workflow State Transition & Incidents
router.patch('/batches/:id/advance', workflow_controller_1.WorkflowController.advanceStage);
router.post('/batches/:id/incidents', workflow_controller_1.WorkflowController.reportIncident);
// 4. System & Live Feed
router.get('/system/dashboard', system_controller_1.SystemController.getDashboardData);
router.post('/system/reset-demo', system_controller_1.SystemController.resetDemoData);
exports.default = router;
