"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const timeline_controller_1 = require("../controllers/timeline.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, timeline_controller_1.getTimeline);
exports.default = router;
