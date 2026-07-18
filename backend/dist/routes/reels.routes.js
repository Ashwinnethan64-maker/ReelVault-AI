"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const reels_controller_1 = require("../controllers/reels.controller");
const router = (0, express_1.Router)();
router.route('/')
    .get(auth_middleware_1.protect, reels_controller_1.getReels)
    .post(auth_middleware_1.protect, reels_controller_1.createReel);
router.route('/:id')
    .get(auth_middleware_1.protect, reels_controller_1.getReelById)
    .patch(auth_middleware_1.protect, reels_controller_1.updateReel)
    .delete(auth_middleware_1.protect, reels_controller_1.deleteReel);
router.post('/:id/restore', auth_middleware_1.protect, reels_controller_1.restoreReel);
exports.default = router;
