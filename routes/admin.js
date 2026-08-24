const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const User = require('../models/User');
const Booking = require('../models/Booking');
const CafeReservation = require('../models/CafeReservation');
const EventBooking = require('../models/EventBooking');
const VenueEnquiry = require('../models/VenueEnquiry');
const ActivityLog = require('../models/ActivityLog');

// All admin routes require admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// Live Executive House Metrics
router.get('/metrics', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeStaff,
      classBookings,
      classCheckInsToday,
      eventCheckInsToday,
      cafeReservations,
      eventBookings,
      venueEnquiries,
      todayLogsCount
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['member', 'user'] } }).catch(() => 0),
      User.countDocuments({ role: { $in: ['admin', 'clerk', 'instructor', 'content_editor'] } }).catch(() => 0),
      Booking.countDocuments({ status: { $ne: 'cancelled' } }).catch(() => 0),
      Booking.countDocuments({ checkedInAt: { $gte: startOfDay } }).catch(() => 0),
      EventBooking.countDocuments({ checkedInAt: { $gte: startOfDay } }).catch(() => 0),
      CafeReservation.countDocuments({ status: { $ne: 'cancelled' } }).catch(() => 0),
      EventBooking.countDocuments({ status: 'confirmed' }).catch(() => 0),
      VenueEnquiry.countDocuments().catch(() => 0),
      ActivityLog.countDocuments({ createdAt: { $gte: startOfDay } }).catch(() => 0)
    ]);

    res.json({
      totalMembers,
      activeStaff,
      classBookings,
      todayCheckIns: classCheckInsToday + eventCheckInsToday,
      cafeReservations,
      eventBookings,
      venueEnquiries,
      todayLogsCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', (req, res) => res.json({ status: 'active' }));

// 1. Members Detail List
router.get('/members-details', async (req, res) => {
  try {
    const members = await User.find({ role: { $in: ['member', 'user'] } })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Movement / Class Bookings Detail List
router.get('/movement-details', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'firstName lastName email credits')
      .populate({ path: 'classSession', populate: { path: 'classType' } })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Café Traffic Detail List
router.get('/cafe-details', async (req, res) => {
  try {
    const reservations = await CafeReservation.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(100);
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Events Detail List
router.get('/events-details', async (req, res) => {
  try {
    const eventBookings = await EventBooking.find()
      .populate('event', 'title startDate location')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(eventBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Venue Leads Detail List
router.get('/venues-details', async (req, res) => {
  try {
    const venueEnquiries = await VenueEnquiry.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(venueEnquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Check-ins Detail List (All check-ins recorded)
router.get('/checkins-details', async (req, res) => {
  try {
    const [classCheckins, eventCheckins, logs] = await Promise.all([
      Booking.find({ checkedInAt: { $exists: true, $ne: null } })
        .populate('user', 'firstName lastName email')
        .populate({ path: 'classSession', populate: { path: 'classType' } })
        .populate('checkedInBy', 'firstName lastName')
        .sort({ checkedInAt: -1 })
        .limit(50),
      EventBooking.find({ checkedInAt: { $exists: true, $ne: null } })
        .populate('event', 'title')
        .populate('user', 'firstName lastName email')
        .sort({ checkedInAt: -1 })
        .limit(50),
      ActivityLog.find({ action: { $regex: /checkin/i } })
        .populate('user', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .limit(50)
    ]);
    res.json({ classCheckins, eventCheckins, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const bcrypt = require('bcryptjs');

// ── User & Staff Management Endpoints ──

// 1. List & Filter Users
router.get('/users', async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex }
      ];
    }

    if (role && role !== 'all') {
      if (role === 'staff') {
        filter.role = { $in: ['admin', 'clerk', 'content_editor', 'instructor', 'finance'] };
      } else if (role === 'members') {
        filter.role = { $in: ['member', 'user'] };
      } else {
        filter.role = role;
      }
    }

    if (status && status !== 'all') {
      if (status === 'active') filter.isActive = true;
      else if (status === 'inactive') filter.isActive = false;
      else if (status === 'unverified') filter.isEmailVerified = false;
    }

    const users = await User.find(filter)
      .select('-passwordHash -twoFactorSecret')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Provision New Staff or User Account
router.post('/users/provision', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'A user account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userRole = role || 'member';

    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : undefined,
      role: userRole,
      passwordHash,
      isActive: true,
      isEmailVerified: true
    });

    if (userRole === 'instructor') {
      const Instructor = require('../models/Instructor');
      // Create corresponding public instructor profile
      await Instructor.create({
        userId: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isActive: true,
        bio: 'New instructor profile',
      });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'staff_provisioned',
      entityModel: 'User',
      entityId: newUser._id,
      description: `Provisioned ${userRole.toUpperCase()} account for ${newUser.firstName} ${newUser.lastName} (${newUser.email})`
    });

    res.status(201).json({
      message: `Successfully provisioned ${userRole} account for ${newUser.firstName} ${newUser.lastName}.`,
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Edit User Profile & Role
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, membershipStatus, classCredits, isActive, isEmailVerified } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    // Validate email if changed
    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) return res.status(409).json({ error: 'Email address already in use.' });
      targetUser.email = normalizedEmail;
    }

    if (firstName) targetUser.firstName = firstName.trim();
    if (lastName) targetUser.lastName = lastName.trim();
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (role) targetUser.role = role;
    if (membershipStatus) targetUser.membershipStatus = membershipStatus;
    if (isActive !== undefined) targetUser.isActive = Boolean(isActive);
    if (isEmailVerified !== undefined) targetUser.isEmailVerified = Boolean(isEmailVerified);
    if (classCredits !== undefined && !isNaN(Number(classCredits))) {
      targetUser.classCredits = Math.max(0, Number(classCredits));
    }

    await targetUser.save();

    if (role === 'instructor') {
      const Instructor = require('../models/Instructor');
      const existingInst = await Instructor.findOne({ userId: targetUser._id });
      if (!existingInst) {
        await Instructor.create({
          userId: targetUser._id,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          isActive: true,
          bio: 'New instructor profile',
        });
      }
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'user_updated',
      entityModel: 'User',
      entityId: targetUser._id,
      description: `Updated profile & role for ${targetUser.firstName} ${targetUser.lastName} (Role: ${targetUser.role})`
    });

    res.json({ message: 'User updated successfully.', user: targetUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Admin Direct Password Reset
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    targetUser.passwordHash = await bcrypt.hash(password, 12);
    await targetUser.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'password_reset_admin',
      entityModel: 'User',
      entityId: targetUser._id,
      description: `Directly reset password for ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`
    });

    res.json({ message: `Password for ${targetUser.firstName} ${targetUser.lastName} has been successfully reset.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Toggle Active Status
router.patch('/users/:id/toggle-status', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    await ActivityLog.create({
      user: req.user._id,
      action: targetUser.isActive ? 'user_reactivated' : 'user_deactivated',
      entityModel: 'User',
      entityId: targetUser._id,
      description: `${targetUser.isActive ? 'Reactivated' : 'Deactivated'} account for ${targetUser.firstName} ${targetUser.lastName}`
    });

    res.json({
      message: `Account has been ${targetUser.isActive ? 'activated' : 'deactivated'}.`,
      isActive: targetUser.isActive
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Toggle Email Verification Status
router.patch('/users/:id/toggle-verify', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    targetUser.isEmailVerified = !targetUser.isEmailVerified;
    await targetUser.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'email_verification_toggle',
      entityModel: 'User',
      entityId: targetUser._id,
      description: `Marked email as ${targetUser.isEmailVerified ? 'Verified' : 'Unverified'} for ${targetUser.firstName} ${targetUser.lastName}`
    });

    res.json({
      message: `Email status updated to ${targetUser.isEmailVerified ? 'Verified' : 'Unverified'}.`,
      isEmailVerified: targetUser.isEmailVerified
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Adjust Class Credits
router.post('/users/:id/adjust-credits', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const delta = Number(amount);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ error: 'A valid non-zero credit adjustment amount is required.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const prevCredits = targetUser.classCredits || 0;
    targetUser.classCredits = Math.max(0, prevCredits + delta);
    await targetUser.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'credits_adjusted_admin',
      entityModel: 'User',
      entityId: targetUser._id,
      description: `Adjusted credits for ${targetUser.firstName} ${targetUser.lastName}: ${delta > 0 ? `+${delta}` : delta} (New Balance: ${targetUser.classCredits})${reason ? ` · Reason: ${reason}` : ''}`
    });

    res.json({
      message: `Adjusted credits for ${targetUser.firstName} ${targetUser.lastName}. New balance: ${targetUser.classCredits}`,
      classCredits: targetUser.classCredits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete User (Safe deletion check)
router.delete('/users/:id', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot delete your own administrative account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'user_deleted',
      entityModel: 'User',
      entityId: targetUser._id,
      description: `Permanently deleted user account for ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`
    });

    res.json({ message: `User ${targetUser.firstName} ${targetUser.lastName} has been deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

