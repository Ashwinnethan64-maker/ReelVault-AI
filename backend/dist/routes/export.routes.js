"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const export_controller_1 = require("../controllers/export.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, export_controller_1.exportVault);
exports.default = router;
