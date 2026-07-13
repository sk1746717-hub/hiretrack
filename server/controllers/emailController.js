import Candidate from "../models/Candidate.js";
import { transporter } from "../utils/emailService.js";
import mongoose from "mongoose";
import path from "path";

// @desc    Send bulk outreach emails
// @route   POST /api/email/send-bulk
// @access  Private (Admin, HR, Recruiter)
export const sendBulkEmail = async (req, res) => {
  try {
    const { subject } = req.body;
    const message = req.body.message || req.body.body;

    let candidateIds = req.body.candidateIds;
    if (typeof candidateIds === "string") {
      try {
        candidateIds = JSON.parse(candidateIds);
      } catch (e) {
        candidateIds = candidateIds.split(",").map(id => id.trim()).filter(Boolean);
      }
    }

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message body are required" });
    }

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: "No candidates selected" });
    }

    // Role check
    if (req.user.role !== "Admin" && req.user.role !== "HR" && req.user.role !== "Recruiter") {
      return res.status(403).json({ message: "Not authorized to send outreach email campaigns" });
    }

    // Filter valid mongoose object IDs
    const validIds = candidateIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid candidate IDs provided" });
    }

    // Fetch candidates
    const candidates = await Candidate.find({ _id: { $in: validIds } });
    if (candidates.length === 0) {
      return res.status(400).json({ message: "No valid candidates found for the selected IDs" });
    }

    // Parse existing attachments metadata
    let existingAtts = req.body.existingAttachments;
    if (typeof existingAtts === "string") {
      try {
        existingAtts = JSON.parse(existingAtts);
      } catch (e) {
        existingAtts = [];
      }
    }

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails = [];

    // SMTP Config
    const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_USER || "no-reply@hiretrack.com";

    for (const candidate of candidates) {
      if (!candidate.email) {
        failedCount++;
        failedEmails.push(`${candidate.fullName || "Unknown Candidate"} (Missing Email)`);
        continue;
      }

      // Basic email syntax validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(candidate.email)) {
        failedCount++;
        failedEmails.push(`${candidate.fullName} (Invalid Email: ${candidate.email})`);
        continue;
      }

      // Resolve attachments dynamically per candidate
      const resolvedAttachments = [];

      // 1. Process files uploaded on-the-fly via Multer
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          resolvedAttachments.push({
            filename: file.originalname,
            content: file.buffer,
          });
        }
      }

      // 2. Process existing attachments dynamically resolved per candidate
      if (existingAtts && Array.isArray(existingAtts)) {
        for (const att of existingAtts) {
          let filePath = null;
          let filename = att.filename;

          if (att.type === "resume" && candidate.resumeUrl) {
            filePath = candidate.resumeUrl;
            filename = candidate.resumeFileName || "Resume.pdf";
          } else if (att.type === "coverLetter" && candidate.coverLetterUrl) {
            filePath = candidate.coverLetterUrl;
            filename = "CoverLetter.pdf";
          } else if (att.type === "certificates" && candidate.certificates && candidate.certificates.length > 0) {
            for (const cert of candidate.certificates) {
              if (cert.url) {
                const certPath = cert.url;
                if (certPath.startsWith("/uploads/")) {
                  resolvedAttachments.push({
                    filename: cert.name || "Certificate.pdf",
                    path: path.join(process.cwd(), certPath),
                  });
                } else {
                  resolvedAttachments.push({
                    filename: cert.name || "Certificate.pdf",
                    path: certPath,
                  });
                }
              }
            }
            continue;
          } else if (att.path || att.url) {
            filePath = att.path || att.url;
          }

          if (filePath) {
            if (filePath.startsWith("/uploads/")) {
              resolvedAttachments.push({
                filename: filename,
                path: path.join(process.cwd(), filePath),
              });
            } else {
              resolvedAttachments.push({
                filename: filename,
                path: filePath,
              });
            }
          }
        }
      }

      // Variable substitution for BOTH subject and body
      const replaceVars = (text) => {
        if (!text) return "";
        const companyName = process.env.COMPANY_NAME || "HireTrack";
        const intDateStr = candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : "TBD";
        const intTimeStr = candidate.interviewTime || "TBD";
        const jobTitle = candidate.jobId?.title || candidate.roleApplied || "Full Stack Developer";
        const recruiter = req.user.name || "Recruiter";

        return text
          .replace(/\{\{candidateName\}\}/gi, candidate.fullName || "")
          .replace(/\{\{CandidateName\}\}/g, candidate.fullName || "")
          .replace(/\{\{candidateEmail\}\}/gi, candidate.email || "")
          .replace(/\{\{CandidateEmail\}\}/g, candidate.email || "")
          .replace(/\{\{jobRole\}\}/gi, jobTitle)
          .replace(/\{\{RoleApplied\}\}/g, jobTitle)
          .replace(/\{\{company\}\}/gi, companyName)
          .replace(/\{\{interviewDate\}\}/gi, intDateStr)
          .replace(/\{\{interviewTime\}\}/gi, intTimeStr)
          .replace(/\{\{recruiterName\}\}/gi, recruiter)
          .replace(/\{\{RecruiterName\}\}/g, recruiter);
      };

      const replacedSubject = replaceVars(subject);
      const replacedBody = replaceVars(message);

      // Replace newlines with <br /> for HTML rendering
      const htmlBody = replacedBody.replace(/\n/g, "<br />");

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #334155; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
          <div style="padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">Outreach Communication</h2>
          </div>
          <div style="line-height: 1.6; font-size: 14px; color: #334155;">
            ${htmlBody}
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;" />
          <div style="text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 5px 0;">
              This outreach communication was sent via HireTrack ATS portal.
            </p>
            <p style="font-size: 10px; color: #cbd5e1; margin: 0;">
              © ${new Date().getFullYear()} HireTrack. All rights reserved.
            </p>
          </div>
        </div>
      `;

      let status = "Success";
      try {
        if (transporter) {
          console.log(`Sending email to: ${candidate.email}`);
          const mailOptions = {
            from: `"HireTrack" <${smtpFrom}>`,
            to: candidate.email,
            subject: replacedSubject,
            html: htmlContent,
            attachments: resolvedAttachments,
          };
          await transporter.sendMail(mailOptions);
          console.log("Email sent successfully.");
        } else {
          // Fallback log
          console.log(`[MOCK EMAIL OUTREACH] To: ${candidate.email} | Subject: ${replacedSubject}`);
        }

        sentCount++;
      } catch (err) {
        console.error(`Failed to send email to ${candidate.email}:`, err.message);
        status = "Failed";
        failedCount++;
        failedEmails.push(`${candidate.fullName} (${candidate.email} - ${err.message})`);
      }

      // Record in candidate email history
      const attachmentNames = resolvedAttachments.map(att => att.filename);
      if (!candidate.emailHistory) {
        candidate.emailHistory = [];
      }
      candidate.emailHistory.push({
        recipient: candidate.email,
        subject: replacedSubject,
        body: replacedBody,
        sentAt: new Date(),
        recruiter: req.user.name,
        recruiterId: req.user._id,
        status,
        attachments: attachmentNames,
      });

      // Save event to candidate activity logs
      candidate.activityTimeline.push({
        type: "email_sent",
        message: `Outreach email campaign sent (${status}): "${replacedSubject}"`,
        performedBy: req.user.name,
        performedById: req.user._id,
        createdAt: new Date(),
      });

      await candidate.save();
    }

    res.json({
      success: true,
      sentCount,
      failedCount,
      failedEmails,
    });
  } catch (error) {
    console.error("Send Bulk Email Error:", error.message);
    res.status(500).json({ message: "Server error while processing email outreach campaign" });
  }
};
