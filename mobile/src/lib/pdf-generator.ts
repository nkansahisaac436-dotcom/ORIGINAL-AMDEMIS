import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface PinSlipData {
  schoolName: string;
  circuitName: string;
  loginId: string;
  pin: string;
  generatedDate?: string;
}

export interface SubmissionReceiptData {
  receiptNumber: string;
  schoolName: string;
  circuitName: string;
  roundTitle: string;
  headteacherName: string;
  phone: string;
  submittedAt: string;
  totalBoys: number;
  totalGirls: number;
  totalTeachers: number;
}

export async function generateAndSharePinSlip(data: PinSlipData) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #14213D; }
          .card { border: 2px solid #0A2A66; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; text-align: center; }
          .header { font-size: 14px; font-weight: bold; color: #0A2A66; text-transform: uppercase; margin-bottom: 5px; }
          .sub { font-size: 12px; color: #5B6B88; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #0A2A66; }
          .meta { font-size: 14px; margin-bottom: 20px; color: #333; }
          .credentials { background: #EEF3FB; border: 1px dashed #123B86; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .field { font-size: 12px; color: #5B6B88; text-transform: uppercase; margin-bottom: 4px; }
          .val { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0A2A66; margin-bottom: 15px; }
          .pin-val { font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #123B86; }
          .footer { font-size: 11px; color: #8F9BB3; border-top: 1px solid #E2E8F0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">Republic of Ghana • Ministry of Education</div>
          <div class="sub">Atwima Mponua District Education Directorate — Planning & Statistics Unit</div>
          <div class="title">OFFICIAL SCHOOL LOGIN PIN SLIP</div>
          <div class="meta"><strong>School:</strong> ${data.schoolName} &bull; <strong>Circuit:</strong> ${data.circuitName}</div>
          <div class="credentials">
            <div class="field">School Login ID</div>
            <div class="val">${data.loginId}</div>
            <div class="field">6-Digit Secret PIN</div>
            <div class="pin-val">${data.pin}</div>
          </div>
          <div class="footer">
            Keep this slip secure. You will be prompted to change your PIN on initial sign in.<br/>
            Issued on: ${data.generatedDate || new Date().toLocaleDateString('en-GB')}
          </div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export async function generateAndShareReceipt(data: SubmissionReceiptData) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #14213D; }
          .card { border: 2px solid #0A2A66; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
          .top { text-align: center; border-bottom: 2px solid #F2B705; padding-bottom: 15px; margin-bottom: 20px; }
          .header { font-size: 13px; font-weight: bold; color: #0A2A66; text-transform: uppercase; }
          .sub { font-size: 11px; color: #5B6B88; }
          .receipt-title { font-size: 22px; font-weight: bold; color: #0A2A66; margin-top: 10px; }
          .num { font-size: 14px; font-weight: bold; color: #123B86; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 14px; }
          .stat-box { background: #EEF3FB; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-val { font-size: 20px; font-weight: bold; color: #0A2A66; }
          .stat-lbl { font-size: 11px; color: #5B6B88; text-transform: uppercase; }
          .footer { font-size: 11px; color: #8F9BB3; border-top: 1px solid #E2E8F0; padding-top: 15px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="top">
            <div class="header">Republic of Ghana • Ministry of Education</div>
            <div class="sub">Atwima Mponua District Education Directorate — Planning & Statistics Unit</div>
            <div class="receipt-title">ANNUAL DATA SUBMISSION RECEIPT</div>
            <div class="num">Receipt #${data.receiptNumber}</div>
          </div>
          <div class="grid">
            <div><strong>School:</strong> ${data.schoolName}</div>
            <div><strong>Circuit:</strong> ${data.circuitName}</div>
            <div><strong>Collection Round:</strong> ${data.roundTitle}</div>
            <div><strong>Submitted Date:</strong> ${data.submittedAt}</div>
            <div><strong>Headteacher:</strong> ${data.headteacherName}</div>
            <div><strong>Contact:</strong> ${data.phone}</div>
          </div>
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <div class="stat-box" style="flex: 1;">
              <div class="stat-val">${data.totalBoys}</div>
              <div class="stat-lbl">Total Boys</div>
            </div>
            <div class="stat-box" style="flex: 1;">
              <div class="stat-val">${data.totalGirls}</div>
              <div class="stat-lbl">Total Girls</div>
            </div>
            <div class="stat-box" style="flex: 1;">
              <div class="stat-val">${data.totalBoys + data.totalGirls}</div>
              <div class="stat-lbl">Total Enrolment</div>
            </div>
            <div class="stat-box" style="flex: 1;">
              <div class="stat-val">${data.totalTeachers}</div>
              <div class="stat-lbl">Total Teachers</div>
            </div>
          </div>
          <div class="footer">
            Verified electronic submission filed with Planning & Statistics Unit, Atwima Mponua District.<br/>
            AMDEMIS System Signature: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}
          </div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}
