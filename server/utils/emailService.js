import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables before initializing SMTP transporter
dotenv.config();

export let transporter;

const initEmailTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = process.env.SMTP_PORT || process.env.EMAIL_PORT;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const secure = process.env.SMTP_SECURE === "true" || process.env.EMAIL_SECURE === "true" || parseInt(port) === 465;

  if (process.env.EMAIL_MOCK_MODE === "true") {
    console.warn("WARNING: EMAIL_MOCK_MODE is enabled. Running email service in mock mode.");
    transporter = null;
    return;
  }

  if (!host) {
    console.warn("WARNING: SMTP_HOST is not configured. Running email service in mock mode.");
    transporter = null;
    return;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port: port ? parseInt(port) : 587,
      secure,
      auth: user ? {
        user,
        pass,
      } : undefined,
    });

    // Asynchronously verify transporter connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error(`SMTP Connection verification failed for ${host}:${port || 587}:`, error.message);
        console.error("Please verify your SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS configurations in .env");
      } else {
        console.log(`Connected to SMTP server: ${host}:${port || 587}`);
      }
    });
  } catch (error) {
    console.error(`SMTP Transporter creation failed for ${host}:${port || 587}:`, error.message);
    transporter = null;
  }
};

// Initialize
initEmailTransporter();

/**
 * Send an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content
 * @returns {Promise<boolean>}
 */
export const sendEmail = async (to, subject, htmlContent) => {
  if (!transporter) {
    console.log(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    const mailOptions = {
      from: `"HireTrack Recruiter Support" <${process.env.SMTP_FROM || process.env.EMAIL_USER || "no-reply@hiretrack.com"}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email notification:", error.message);
    // Don't let email failures crash the main candidate pipeline process
    return false;
  }
};

/**
 * Send email when candidate is added
 */
export const sendCandidateAddedEmail = async (candidate) => {
  const subject = `Application Received - ${candidate.fullName}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to the Hiring Process!</h2>
      <p>Hello <strong>${candidate.fullName}</strong>,</p>
      <p>Thank you for submitting your application for the position of <strong>${candidate.roleApplied}</strong> at HireTrack.</p>
      <p>Our recruitment team is reviewing your qualifications and experience. We will get in touch with you shortly if your profile matches our requirements.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">This is an automated outreach notification. Please do not reply directly to this email.</p>
    </div>
  `;
  return sendEmail(candidate.email, subject, htmlContent);
};

/**
 * Send email when interview is scheduled
 */
export const sendInterviewScheduledEmail = async (candidate, dateStr, timeStr, modeStr, linkStr) => {
  const subject = `Interview Scheduled - HireTrack`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">Interview Schedule Confirmation</h2>
      <p>Hello <strong>${candidate.fullName}</strong>,</p>
      <p>We are pleased to invite you to interview for the position of <strong>${candidate.roleApplied}</strong>.</p>
      <p>Here are the scheduled interview details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 120px;">Date:</td>
          <td style="padding: 8px 0;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Time:</td>
          <td style="padding: 8px 0;">${timeStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Format:</td>
          <td style="padding: 8px 0;">${modeStr}</td>
        </tr>
        ${linkStr ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Meeting Link:</td>
          <td style="padding: 8px 0;"><a href="${linkStr}" style="color: #2563eb; text-decoration: underline;">Join Meeting</a></td>
        </tr>` : ''}
      </table>
      <p>Please log in on time and ensure your camera and microphone are properly configured.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">If you need to reschedule, please notify your recruiter at your earliest convenience.</p>
    </div>
  `;
  return sendEmail(candidate.email, subject, htmlContent);
};

/**
 * Send email when candidate is selected
 */
export const sendCandidateSelectedEmail = async (candidate) => {
  const subject = `Congratulations! Job Offer from HireTrack`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #10b981; margin-bottom: 20px;">Congratulations!</h2>
      <p>Hello <strong>${candidate.fullName}</strong>,</p>
      <p>We are absolutely thrilled to offer you the position of <strong>${candidate.roleApplied}</strong> at HireTrack!</p>
      <p>Our team was highly impressed by your interviews, skills, and background. We believe your experience makes you an outstanding fit for our engineering team.</p>
      <p>A member of our Human Resources department will follow up with you shortly to share the formal offer letter, discuss salary details, benefits, and schedule your onboarding session.</p>
      <p>Welcome to the team!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Best regards,<br />The HireTrack Recruitment Team</p>
    </div>
  `;
  return sendEmail(candidate.email, subject, htmlContent);
};

/**
 * Send email when candidate is rejected
 */
export const sendCandidateRejectedEmail = async (candidate) => {
  const subject = `Application Status Update - ${candidate.roleApplied}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #64748b; margin-bottom: 20px;">Application Update</h2>
      <p>Hello <strong>${candidate.fullName}</strong>,</p>
      <p>Thank you for your interest in the position of <strong>${candidate.roleApplied}</strong> at HireTrack and for taking the time to participate in our recruitment process.</p>
      <p>We received applications from many talented individuals. While we were impressed by your background, we have decided to move forward with another candidate whose qualifications more closely align with the specific technical needs of this role at this time.</p>
      <p>We will keep your resume on file for future opportunities that match your expertise. We wish you the very best in your job search and professional endeavors.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Best regards,<br />The HireTrack Recruitment Team</p>
    </div>
  `;
  return sendEmail(candidate.email, subject, htmlContent);
};
