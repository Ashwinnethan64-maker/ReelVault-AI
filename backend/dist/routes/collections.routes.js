"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const collections_controller_1 = require("../controllers/collections.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.route('/')
    .get(collections_controller_1.getCollections)
    .post(collections_controller_1.createCollection);
router.route('/:id')
    .patch(collections_controller_1.updateCollection)
    .delete(collections_controller_1.deleteCollection);
router.route('/:id/reels')
    .post(collections_controller_1.addReelToCollection);
router.route('/:id/reels/:reelId')
    .delete(collections_controller_1.removeReelFromCollection);
exports.default = router;
