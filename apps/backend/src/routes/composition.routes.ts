import { Router } from 'express';
import {
  createCompositionHandler,
  getCompositionByIdHandler,
  getAllCompositionsHandler,
  updateCompositionHandler,
  patchCompositionHandler,
  deleteCompositionHandler,
  duplicateCompositionHandler,
  updateMediaUrlsHandler,
} from '../controllers/composition.controller';

const router = Router();

router.post('/', createCompositionHandler);
router.get('/', getAllCompositionsHandler);
router.get('/:id', getCompositionByIdHandler);
router.put('/:id', updateCompositionHandler);
router.patch('/:id', patchCompositionHandler);
router.post('/:id/media-urls', updateMediaUrlsHandler);
router.post('/:id/duplicate', duplicateCompositionHandler);
router.delete('/:id', deleteCompositionHandler);

export default router;
