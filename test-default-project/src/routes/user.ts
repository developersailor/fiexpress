// user routes stub
import express from 'express';
const router = express.Router();
router.get('/', (req,res)=>res.json({msg:'users'}));
export default router;
