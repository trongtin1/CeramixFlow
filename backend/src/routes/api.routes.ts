import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { WorkflowController } from '../controllers/workflow.controller';
import { SystemController } from '../controllers/system.controller';

const router = Router();

// 1. AI Order Parser
router.post('/orders/parse-ai', OrderController.parseOrderWithAi);

// 2. Batches CRUD & Workflow
router.post('/batches', OrderController.createBatch);
router.get('/batches', OrderController.getAllBatches);
router.get('/batches/:id', OrderController.getBatchById);

// 3. Workflow State Transition & Incidents
router.patch('/batches/:id/advance', WorkflowController.advanceStage);
router.post('/batches/:id/incidents', WorkflowController.reportIncident);

// 4. System & Live Feed
router.get('/system/dashboard', SystemController.getDashboardData);
router.post('/system/reset-demo', SystemController.resetDemoData);

export default router;
