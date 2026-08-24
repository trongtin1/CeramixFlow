"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const workflow_controller_1 = require("../controllers/workflow.controller");
const system_controller_1 = require("../controllers/system.controller");
const router = (0, express_1.Router)();
// 1. AI Order Parser & Interactive RAG Chat
router.post('/orders/parse-ai', order_controller_1.OrderController.parseOrderWithAi);
router.post('/chat/assistant', order_controller_1.OrderController.chatWithRagAssistant);
// 2. Batches CRUD & Workflow
router.post('/batches', order_controller_1.OrderController.createBatch);
router.get('/batches', order_controller_1.OrderController.getAllBatches);
router.post('/batches/reorder', order_controller_1.OrderController.reorderBatches);
router.get('/batches/:id', order_controller_1.OrderController.getBatchById);
router.put('/batches/:id', order_controller_1.OrderController.updateBatch);
// 3. Workflow State Transition & Incidents
router.patch('/batches/:id/advance', workflow_controller_1.WorkflowController.advanceStage);
router.patch('/batches/:id/rollback', workflow_controller_1.WorkflowController.rollbackStage);
router.post('/batches/:id/incidents', workflow_controller_1.WorkflowController.reportIncident);
// 4. System & Live Feed
router.get('/system/dashboard', system_controller_1.SystemController.getDashboardData);
router.post('/system/reset-demo', system_controller_1.SystemController.resetDemoData);
exports.default = router;
