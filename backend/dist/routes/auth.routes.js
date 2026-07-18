"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Supabase handles register/login natively.
// The frontend calls this route with the Supabase JWT to sync the user into the backend's database.
router.get('/sync', auth_middleware_1.protect, auth_controller_1.syncUser);
router.patch('/profile', auth_middleware_1.protect, auth_controller_1.updateProfile);
exports.default = router;
