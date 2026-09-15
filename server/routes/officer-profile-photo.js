const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("../database/database");
const { authenticateToken } = require("./auth");

const router = express.Router();
const directory = path.join(__dirname, "..", "uploads", "officer-profiles");
const prefix = "/uploads/officer-profiles/";
const extensions = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter(req, file, callback) {
    callback(
      extensions[file.mimetype]
        ? null
        : new Error("Only JPG, PNG, and WEBP images are allowed."),
      !!extensions[file.mimetype],
    );
  },
}).single("profilePicture");

function activeOfficer(req, res, next) {
  try {
    const id = Number(req.authUser?.userId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Your session is invalid. Please log in again.",
        });
    }
    const user = db
      .prepare(
        "SELECT id FROM users WHERE id = ? AND role = 'FINES_OFFICER' AND account_status = 'ACTIVE'",
      )
      .get(id);
    if (!user)
      return res
        .status(403)
        .json({
          success: false,
          message: "An active Fines Officer account is required.",
        });
    req.photoOfficerId = id;
    next();
  } catch (error) {
    console.error("Officer photo authorization failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to verify your account." });
  }
}

function removeFile(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (error) {
    if (error.code !== "ENOENT")
      console.error("Officer photo cleanup failed:", error);
  }
}

function imageExtension(bytes) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return ".jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return ".png";
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return ".webp";
  return null;
}

// POST /api/officer-profile/me/profile-picture
// Authorization runs before accepting the file. The token identifies its owner.
router.post(
  "/me/profile-picture",
  authenticateToken,
  activeOfficer,
  (req, res) => {
    upload(req, res, (error) => {
      if (error)
        return res.status(400).json({
          success: false,
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "Profile picture must be 5 MB or smaller."
              : error.message,
        });
      if (!req.file)
        return res
          .status(400)
          .json({
            success: false,
            message: "Please select a profile picture.",
          });
      const extension = imageExtension(req.file.buffer);
      if (!extension || extension !== extensions[req.file.mimetype]) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Please select a valid JPG, PNG, or WEBP image.",
          });
      }
      let savedPath;
      let committed = false;
      try {
        const current = db
          .prepare(
            "SELECT profile_picture_uri FROM users WHERE id = ? AND role = 'FINES_OFFICER' AND account_status = 'ACTIVE'",
          )
          .get(req.photoOfficerId);
        if (!current)
          return res
            .status(403)
            .json({
              success: false,
              message: "Your officer account is no longer available.",
            });
        fs.mkdirSync(directory, { recursive: true });
        const filename = `officer-${req.photoOfficerId}-${crypto.randomUUID()}${extension}`;
        savedPath = path.join(directory, filename);
        fs.writeFileSync(savedPath, req.file.buffer, { flag: "wx" });
        const uri = prefix + filename;
        const result = db
          .prepare(
            "UPDATE users SET profile_picture_uri = ? WHERE id = ? AND role = 'FINES_OFFICER' AND account_status = 'ACTIVE'",
          )
          .run(uri, req.photoOfficerId);
        if (Number(result.changes) !== 1)
          throw new Error("Officer photo update did not affect one account.");
        committed = true;
        // Only clean up files produced by this endpoint for this same officer.
        // Existing photos in other upload folders are preserved.
        const oldUri = current.profile_picture_uri;
        if (typeof oldUri === "string" && oldUri.startsWith(prefix)) {
          const oldName = oldUri.slice(prefix.length);
          if (
            new RegExp(
              `^officer-${req.photoOfficerId}-[0-9a-f-]+\\.(jpg|png|webp)$`,
            ).test(oldName)
          ) {
            const referenced = db
              .prepare(
                "SELECT id FROM users WHERE profile_picture_uri = ? LIMIT 1",
              )
              .get(oldUri);
            if (!referenced) removeFile(path.join(directory, oldName));
          }
        }
        return res.json({
          success: true,
          message: "Profile picture updated successfully.",
          profilePictureUri: uri,
        });
      } catch (caught) {
        console.error("Officer photo upload failed:", caught);
        if (savedPath && !committed) removeFile(savedPath);
        if (committed)
          return res.json({
            success: true,
            message: "Profile picture updated successfully.",
            profilePictureUri: prefix + path.basename(savedPath),
          });
        return res
          .status(500)
          .json({
            success: false,
            message: "Unable to save your profile picture. Please try again.",
          });
      }
    });
  },
);

module.exports = router;
