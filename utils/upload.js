const multer = require("multer");
const ApiError = require("./errors/ApiError");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images");
    },

    filename: (req, file, cb) => {
      const fileName = Date.now() + "-" + file.originalname;
      cb(null, fileName);
    },
  }),

  limits: {
    fileSize: 1024 * 1024 * 5,
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/svg+xml" ||
      file.mimetype === "image/gif" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Image file type isn't supported"), false);
    }
  },
});

module.exports = upload;
