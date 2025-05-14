import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT, upload.none()); // Apply verifyJWT middleware to all routes in this file

router.route("/create-playlist").post(createPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router
  .route("/addVideoToPlaylist/:videoId/:playlistId")
  .patch(addVideoToPlaylist);
router
  .route("/removeVideoFromPlaylist/:videoId/:playlistId")
  .patch(removeVideoFromPlaylist);

router.route("/user-playlist/:userId").get(getUserPlaylists);

export default router;
