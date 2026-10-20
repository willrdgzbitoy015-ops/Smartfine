// Evidence photos and the "who handled this fine" record.
// Mounted at /api/fines, before the main fines routes.
//
//   GET    /api/fines/:id/trail                    who handled it + photos
//   POST   /api/fines/:id/evidence                 add one photo (field "photo")
//   DELETE /api/fines/:id/evidence/:evidenceId     remove a photo
//   GET    /api/fines/evidence-file/:evidenceId    the photo (signed link)
const express = require("express");
const multer = require("multer");

const db = require("../database/database");
const evidence = require("../database/fine-evidence");
const { authenticateToken } = require("./auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: evidence.MAX_EVIDENCE_BYTES, files: 1, fields: 0 },
}).single("photo");

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// The signed-in account, which must still be active.
function activeUser(req, res, next) {
  try {
    const userId = positiveId(req.authUser?.userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Please sign in again." });
    }

    const user = db
      .prepare("SELECT id, role, account_status FROM users WHERE id = ?")
      .get(userId);

    if (!user || user.account_status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "An active account is required." });
    }

    req.evidenceUser = { id: Number(user.id), role: String(user.role).toUpperCase() };
    res.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    console.error("Evidence authorization failed:", error);
    return res.status(500).json({ success: false, message: "Could not verify your account." });
  }
}

// Loads the fine in :id and checks the user may see it.
function viewableFine(req, res, next) {
  const fineId = positiveId(req.params.id);

  if (!fineId) {
    return res.status(400).json({ success: false, message: "Invalid fine ID." });
  }

  try {
    const fine = evidence.fineRow(fineId);

    // A fine the user may not see answers the same as a missing one.
    if (!fine || !evidence.canView(req.evidenceUser, fine)) {
      return res.status(404).json({ success: false, message: "This fine is not available." });
    }

    req.evidenceFine = fine;
    next();
  } catch (error) {
    console.error("Evidence fine lookup failed:", error);
    return res.status(500).json({ success: false, message: "Could not load this fine." });
  }
}

function sendError(res, error, fallback) {
  if (error instanceof evidence.EvidenceError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  console.error(fallback, error);
  return res.status(500).json({ success: false, message: fallback });
}

// The photo itself. The signed link is the permission: it is only handed out
// in a trail the viewer was allowed to load, and it expires.
router.get("/evidence-file/:evidenceId", (req, res) => {
  const evidenceId = positiveId(req.params.evidenceId);

  if (!evidenceId || !evidence.linkIsValid(evidenceId, req.query.expires, req.query.signature)) {
    return res.status(403).json({
      success: false,
      message: "This photo link has expired. Reload the fine to see it.",
    });
  }

  try {
    const file = evidence.evidenceFile(evidenceId);

    if (!file) {
      return res.status(404).json({ success: false, message: "This photo is no longer available." });
    }

    res.set({
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });

    return res.sendFile(file.filePath);
  } catch (error) {
    console.error("Evidence file failed:", error);
    return res.status(500).json({ success: false, message: "Could not load this photo." });
  }
});

router.get("/:id/trail", authenticateToken, activeUser, viewableFine, (req, res) => {
  try {
    return res.json({
      success: true,
      trail: evidence.fineTrail(req.evidenceFine, req.evidenceUser),
    });
  } catch (error) {
    return sendError(res, error, "Could not load who handled this fine.");
  }
});

router.post("/:id/evidence", authenticateToken, activeUser, viewableFine, (req, res) => {
  // Checked before the photo is accepted, so a refused upload is not stored.
  if (req.evidenceUser.role === "STUDENT") {
    return res.status(403).json({
      success: false,
      code: "NOT_ALLOWED",
      message: "Only an Administrator or the Officer who recorded this fine can add evidence.",
    });
  }

  upload(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        code: "INVALID_UPLOAD",
        message:
          uploadError.code === "LIMIT_FILE_SIZE"
            ? "Each evidence photo must be 5 MB or smaller."
            : "Please attach one photo.",
      });
    }

    if (!req.file?.buffer?.length) {
      return res.status(400).json({
        success: false,
        code: "PHOTO_REQUIRED",
        message: "Please attach a photo.",
      });
    }

    try {
      const evidenceId = evidence.addEvidence({
        fineId: req.evidenceFine.id,
        user: req.evidenceUser,
        buffer: req.file.buffer,
      });

      const trail = evidence.fineTrail(evidence.fineRow(req.evidenceFine.id), req.evidenceUser);

      return res.status(201).json({
        success: true,
        message: "Evidence photo added.",
        evidenceId,
        trail,
      });
    } catch (error) {
      return sendError(res, error, "Could not save the evidence photo.");
    }
  });
});

router.delete(
  "/:id/evidence/:evidenceId",
  authenticateToken,
  activeUser,
  viewableFine,
  (req, res) => {
    const evidenceId = positiveId(req.params.evidenceId);

    if (!evidenceId) {
      return res.status(400).json({ success: false, message: "Invalid photo ID." });
    }

    try {
      evidence.removeEvidence({
        fineId: req.evidenceFine.id,
        evidenceId,
        user: req.evidenceUser,
      });

      return res.json({
        success: true,
        message: "Evidence photo removed.",
        trail: evidence.fineTrail(evidence.fineRow(req.evidenceFine.id), req.evidenceUser),
      });
    } catch (error) {
      return sendError(res, error, "Could not remove the evidence photo.");
    }
  },
);

module.exports = router;
