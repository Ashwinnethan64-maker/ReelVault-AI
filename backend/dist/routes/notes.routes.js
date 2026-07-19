"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notes_controller_1 = require("../controllers/notes.controller");
const router = (0, express_1.Router)();
router.route('/:reelId')
    .get(auth_middleware_1.protect, notes_controller_1.getReelNotes)
    .post(auth_middleware_1.protect, notes_controller_1.createOrUpdateNote);
exports.default = router;
