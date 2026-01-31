import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateEmailRequest {
  studentEmail: string;
  studentName: string;
  enrollmentNumber: string;
  course: string;
  institution: string;
  issueYear: number;
  certificateHash: string;
  transactionHash: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-certificate-email function called");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      studentEmail,
      studentName,
      enrollmentNumber,
      course,
      institution,
      issueYear,
      certificateHash,
      transactionHash,
    }: CertificateEmailRequest = await req.json();

    console.log("Sending certificate email to:", studentEmail);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!studentEmail || !emailRegex.test(studentEmail)) {
      console.error("Invalid email format:", studentEmail);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid email format: "${studentEmail}". Please use a valid email address.` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verification URL
    const verifyUrl = `https://chain-certify-hub.lovable.app/verify?hash=${certificateHash}`;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ChainCertify <onboarding@resend.dev>",
        to: [studentEmail],
        subject: `🎓 Your Certificate Has Been Issued - ${course}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Certificate Issued!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Secured on Blockchain</p>
              </div>
              
              <!-- Body -->
              <div style="padding: 40px 30px;">
                <p style="font-size: 18px; color: #1e293b; margin: 0 0 20px;">Dear <strong>${studentName}</strong>,</p>
                
                <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 25px;">
                  Congratulations! 🎉 Your certificate has been successfully issued and permanently recorded on the blockchain.
                </p>
                
                <!-- Certificate Details Card -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 25px 0; border-left: 4px solid #6366f1;">
                  <h3 style="color: #1e293b; margin: 0 0 16px; font-size: 16px;">📋 Certificate Details</h3>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Student Name</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${studentName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Enrollment No.</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${enrollmentNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Course</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${course}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Institution</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${institution}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Issue Year</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${issueYear}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Blockchain Info -->
                <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0;">
                  <h4 style="color: #92400e; margin: 0 0 12px; font-size: 14px;">🔗 Blockchain Verification</h4>
                  <p style="font-size: 12px; color: #78716c; margin: 0 0 8px; word-break: break-all;">
                    <strong>Certificate Hash:</strong><br/>
                    <code style="background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">${certificateHash}</code>
                  </p>
                  <p style="font-size: 12px; color: #78716c; margin: 0; word-break: break-all;">
                    <strong>Transaction Hash:</strong><br/>
                    <code style="background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">${transactionHash}</code>
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verifyUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
                    🔍 Verify Certificate
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 25px 0 0;">
                  You can also verify your certificate anytime by visiting the Student Portal and logging in with your credentials.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 14px; color: #64748b; margin: 0;">
                  ChainCertify - Blockchain Certificate Verification System
                </p>
                <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0;">
                  This is an automated email. Please do not reply.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending certificate email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
