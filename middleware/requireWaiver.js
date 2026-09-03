const WaiverVersion = require('../models/WaiverVersion');
const Setting = require('../models/Setting');

module.exports = async function requireWaiver(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      return res.redirect('/login');
    }

    // 1. Check Global Settings if waiver gate is globally enabled
    const waiverSetting = await Setting.findOne({ key: 'waiver_required' });
    if (waiverSetting && (waiverSetting.value === false || waiverSetting.value === 'false')) {
      return next(); // Waiver gate disabled sitewide
    }

    // 2. Get current active waiver version
    const current = await WaiverVersion.findOne({ isActive: true });
    if (!current) {
      return next(); // No waiver version published yet — allow through
    }

    // 3. Check if user signed the current active version
    const hasSigned = (user.waiver?.signed && user.waiver?.version === current.version) ||
                      (user.waiverSigned && user.waiverVersion === current.version);

    if (hasSigned) {
      return next();
    }

    // 4. Not signed — return 403 for API / JSON requests
    if (req.xhr || req.headers.accept?.includes('application/json') || req.baseUrl?.startsWith('/api') || req.path?.startsWith('/api/')) {
      return res.status(403).json({
        success: false,
        requiresWaiver: true,
        error: 'You must sign the Aora House liability waiver before booking a class.',
        waiverVersion: current.version,
      });
    }

    // 5. HTML request fallback — redirect to waiver page
    return res.redirect(`/member/waiver?returnTo=${encodeURIComponent(req.originalUrl)}`);
  } catch (err) {
    console.error('[requireWaiver error]', err.message);
    next(err);
  }
};
