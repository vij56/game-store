const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Admin only" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

module.exports = adminMiddleware;
