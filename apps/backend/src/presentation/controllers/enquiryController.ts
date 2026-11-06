import type { RequestHandler } from 'express';
import type { EnquiryService } from '../../business/services/EnquiryService';

export interface EnquiryController {
  submit: RequestHandler;
}

export function createEnquiryController(enquiryService: EnquiryService): EnquiryController {
  const submit: RequestHandler = async (req, res) => {
    const receipt = await enquiryService.submit(req.body);
    res.status(201).json({ data: receipt });
  };

  return { submit };
}
