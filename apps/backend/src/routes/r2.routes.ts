import { Router } from 'express';
import { getPresignedUploadUrlHandler, getBatchPresignedUploadUrlsHandler, proxyImageHandler } from '../controllers/r2.controller';

const router = Router();

router.post('/presigned-url', getPresignedUploadUrlHandler);
router.post('/presigned-urls/batch', getBatchPresignedUploadUrlsHandler);
router.get('/proxy-image', proxyImageHandler);

export default router;
