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

    // 3. Check if user signed the waiver AND provided complete emergency contact info
    const hasSigned = current
      ? Boolean(
          (user.waiver?.signed && (user.waiver?.version === current.version || !user.waiver?.version)) ||
          (user.waiverSigned && (user.waiverVersion === current.version || !user.waiverVersion))
        )
      : Boolean(user.waiver?.signed || user.waiverSigned || user.waiverSignedAt);

    const hasEmergencyContact = Boolean(
      user.emergencyContactName &&
      String(user.emergencyContactName).trim().length >= 2 &&
      user.emergencyContactPhone &&
      String(user.emergencyContactPhone).trim().length >= 8 &&
      user.emergencyContactRelation &&
      String(user.emergencyContactRelation).trim().length >= 2
    );

    if (hasSigned && hasEmergencyContact) {
      return next();
    }

    // 4. Not complete — return 403 for API / JSON requests
    if (req.xhr || req.headers.accept?.includes('application/json') || req.baseUrl?.startsWith('/api') || req.path?.startsWith('/api/')) {
      return res.status(403).json({
        success: false,
        requiresWaiver: true,
        missingWaiver: !hasSigned,
        missingEmergencyContact: !hasEmergencyContact,
        error: 'Please provide an emergency contact and sign the Aora House liability waiver before booking your first class.',
        waiverVersion: current?.version || '2026-09',
      });
    }

    // 5. HTML request fallback — redirect to waiver page
    return res.redirect(`/member/waiver?returnTo=${encodeURIComponent(req.originalUrl)}`);
  } catch (err) {
    console.error('[requireWaiver error]', err.message);
    next(err);
  }
};
