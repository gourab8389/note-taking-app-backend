import { Router, RequestHandler } from 'express';
import { NoteController } from '../controllers/noteController';
import { authenticate } from '../middleware/auth';
import { validateNote, handleValidationErrors } from '../middleware/validation';

const router = Router();
const noteController = new NoteController();

router.use(authenticate);

router.post('/', validateNote, handleValidationErrors, noteController.createNote as RequestHandler);
router.get('/', noteController.getNotes as RequestHandler);
router.get('/:id', noteController.getNoteById as RequestHandler);
router.put('/:id', validateNote, handleValidationErrors, noteController.updateNote as RequestHandler);
router.delete('/:id', noteController.deleteNote as RequestHandler);

export default router;