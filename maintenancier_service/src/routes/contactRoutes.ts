import express from 'express';
import { getUrgenceContactsByEndUserId , addUrgenceContactsByEndUserId} from '../controllers/contactController';

const router = express.Router();

router.get('/urgence/:id', getUrgenceContactsByEndUserId);
router.post('/urgence/:id', addUrgenceContactsByEndUserId);

export default router;
