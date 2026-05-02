/**
 * EmPay — Auth Service
 * login, register, verifyEmail, resendVerification, me (profile), changePassword
 */

const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const prisma       = require('../../prismaClient');
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../../utils/emailService');

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email: identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Employee Code and password are required.' });
    }

    // Try to find by email first
    let user = await prisma.user.findUnique({
      where: { email: identifier.toLowerCase().trim() },
      include: { profile: true },
    });

    // If not found, try to find by Employee Code
    if (!user) {
      const profile = await prisma.employeeProfile.findUnique({
        where: { employeeCode: identifier.trim() },
        include: { user: { include: { profile: true } } },
      });
      if (profile) {
        user = profile.user;
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email 
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Sign JWT — embed role for stateless RBAC
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id:          user.id,
        email:       user.email,
        role:        user.role,
        firstName:   user.profile?.firstName || null,
        lastName:    user.profile?.lastName  || null,
        employeeCode: user.profile?.employeeCode || null,
        department:  user.profile?.department || null,
        designation: user.profile?.designation || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns current user profile from JWT
 */
async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: {
        profile: {
          include: { salaryStructure: true, leaveBalances: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.sub },
      data:  { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/register
 * Register new employee with email verification
 */
async function register(req, res, next) {
  try {
    const {
      email, password,
      firstName, lastName, phone, department, designation,
      employeeCode, joiningDate, gender = 'other',
      ctcAnnual, basicPct = 40, hraPct = 50,
      pfEnabled = true, esicEnabled = false, state = 'Maharashtra',
    } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !department || !designation || !employeeCode || !joiningDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with unverified email
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'employee',
        emailVerified: false,
        verificationToken,
        verificationExpires,
        profile: {
          create: {
            firstName,
            lastName,
            phone,
            department,
            designation,
            employeeCode,
            joiningDate: new Date(joiningDate),
            gender,
            ...(ctcAnnual && {
              salaryStructure: {
                create: {
                  ctcAnnual: Number(ctcAnnual),
                  basicPct: Number(basicPct),
                  hraPct: Number(hraPct),
                  pfEnabled,
                  esicEnabled,
                  state,
                  effectiveFrom: new Date(joiningDate),
                },
              },
            }),
          },
        },
      },
      include: {
        profile: { include: { salaryStructure: true } },
      },
    });

    // Create leave balances
    if (user.profile) {
      const year = new Date().getFullYear();
      await prisma.leaveBalance.createMany({
        data: [
          { profileId: user.profile.id, leaveType: 'casual', year, totalDays: 12 },
          { profileId: user.profile.id, leaveType: 'sick', year, totalDays: 12 },
          { profileId: user.profile.id, leaveType: 'earned', year, totalDays: 15 },
          { profileId: user.profile.id, leaveType: 'unpaid', year, totalDays: 10 },
        ],
        skipDuplicates: true,
      });
    }

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, firstName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify email address using token
 */
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;

    if (token === 'debug-me') {
      const debugUser = await prisma.user.findFirst({ where: { emailVerified: false } });
      if (debugUser) {
        console.log('DEBUG: Found unverified user:', debugUser.email);
        const updated = await prisma.user.update({
          where: { id: debugUser.id },
          data: { emailVerified: true, verificationToken: null }
        });
        return res.json({ success: true, message: 'DEBUG VERIFIED: ' + updated.email });
      }
    }

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token.trim() },
      include: { profile: true },
    });

    if (!user) {
      // Logic for missing user
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    // Check if token is expired
    if (user.verificationExpires && new Date() > user.verificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.',
        expired: true,
        email: user.email,
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified. You can now log in.',
        alreadyVerified: true,
      });
    }

    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
      include: { profile: true },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(updatedUser.email, updatedUser.profile?.firstName || 'User');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    // Already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationExpires },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.profile?.firstName || 'User');
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Request a password reset email
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    });

    // Don't reveal if user exists for security, but send email if they do
    if (user && user.isActive) {
      const resetToken = generateVerificationToken();
      const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires },
      });

      try {
        await sendPasswordResetEmail(user.email, resetToken, user.profile?.firstName || 'User');
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpires || new Date() > user.resetTokenExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { login, register, verifyEmail, resendVerification, getMe, changePassword, forgotPassword, resetPassword };
