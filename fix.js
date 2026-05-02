const fs = require('fs');
const file = 'src/modules/leaves/leave.controller.js';
let content = fs.readFileSync(file, 'utf8');

// remove // from start of lines
content = content.replace(/^\/\/ /gm, '');
content = content.replace(/^\/\//gm, '');

// fix the syntax error in applyLeave
content = content.replace(/Check leave balance[\s\S]*?\} crea/g, `    // Check leave balance (skip for unpaid)
    if (leaveType !== 'unpaid') {
      const profile = await prisma.employeeProfile.findUnique({ where: { userId: employeeId } });
      if (!profile) return res.status(404).json({ success: false, message: 'Employee profile not found.' });

      const balance = await prisma.leaveBalance.findUnique({
        where: {
          profileId_leaveType_year: {
            profileId: profile.id,
            leaveType,
            year: from.getFullYear(),
          },
        },
      });

      if (!balance) {
        return res.status(400).json({ success: false, message: 'No leave balance found for this type.' });
      }

      const remaining = balance.totalDays - balance.consumed;
      if (totalDays > remaining) {
        return res.status(400).json({
          success: false,
          message: \`Insufficient \${leaveType} leave balance. Remaining: \${remaining} day(s).\`,
        });
      }
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        fromDate: from,
        toDate:   to,
        totalDays,
        reason,
        status: 'pending',
      },
    });

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
}`);

fs.writeFileSync(file, content);
console.log('Fixed leave.controller.js');
