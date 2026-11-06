import { Router } from 'express';
import type { EnquiryService } from '../../business/services/EnquiryService';
import { createEnquiryController } from '../controllers/enquiryController';

export function createEnquiryRouter(enquiryService: EnquiryService): Router {
  const router = Router();
  const controller = createEnquiryController(enquiryService);

  router.post('/', controller.submit);

  return router;
}
