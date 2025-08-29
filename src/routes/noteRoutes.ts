import { Router } from 'express';
import { NoteController } from '../controllers/noteController';
import { authenticate } from '../middleware/auth';
import { validateNote, handleValidationErrors } from '../middleware/validation';

const router = Router();
const noteController = new NoteController();

router.use(authenticate);

router.post('/', validateNote, handleValidationErrors, noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);
router.put('/:id', validateNote, handleValidationErrors, noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

export default router;