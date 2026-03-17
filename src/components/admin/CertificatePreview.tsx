import React, { forwardRef, useEffect, useState } from 'react';
import * as QRCode from 'qrcode';

interface CertificatePreviewProps {
  certificateNumber: string;
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
  certificateHash: string;
  issuerName?: string;
  issuerTitle?: string;
}

export const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  (
    {
      certificateNumber,
      studentName,
      course,
      institution,
      issueDate,
      certificateHash,
      issuerName = 'Yash Gayake',
      issuerTitle = 'Registrar'
    },
    ref
  ) => {
    const [qrDataUrl, setQrDataUrl] = useState('');

    const formattedDate = new Date(issueDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    useEffect(() => {
      let active = true;

      const generateQr = async () => {
        try {
          const verifyUrl = `${window.location.origin}/verify?hash=${
            certificateHash || 'preview-hash'
          }`;

          const url = await QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 220,
            color: {
              dark: '#111111',
              light: '#ffffff'
            }
          });

          if (active) {
            setQrDataUrl(url);
          }
        } catch (error) {
          console.error('QR generation failed:', error);
          if (active) {
            setQrDataUrl('');
          }
        }
      };

      generateQr();

      return () => {
        active = false;
      };
    }, [certificateHash]);

    return (
      <div className="flex justify-center bg-white p-4">
        <div
          ref={ref}
          className="bg-[#fcfbf7] text-[#1f2937]"
          style={{
            width: '794px',
            height: '1123px',
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div
            className="h-full border-4 border-[#b89552] p-2"
            style={{ boxSizing: 'border-box' }}
          >
            <div
              className="flex h-full flex-col border-2 border-[#b89552] px-8 py-6"
              style={{ boxSizing: 'border-box' }}
            >
              <div className="mb-3 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#6b2d2d] text-center">
                  <div className="leading-tight">
                    <div className="text-lg font-bold text-[#6b2d2d]">BC</div>
                    <div className="text-[8px] text-[#6b2d2d]">CHAIN</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-[34px] font-bold tracking-wide text-[#111827]">
                  {institution}
                </h1>

                <h2
                  className="mt-3 text-[44px] tracking-[0.18em] text-[#2b2b52]"
                  style={{ fontFamily: 'serif' }}
                >
                  CERTIFICATE
                </h2>

                <p className="mt-3 text-[18px] font-semibold">
                  Certificate No: {certificateNumber}
                </p>
              </div>

              <div className="mt-7 text-center">
                <h3
                  className="text-[22px] font-bold uppercase underline"
                  style={{ fontFamily: 'serif' }}
                >
                  TO WHOM IT MAY CONCERN
                </h3>

                <p className="mt-6 text-[22px]">This is to certify that</p>

                <h4 className="mt-5 text-[40px] font-extrabold uppercase tracking-wide text-[#0f172a]">
                  {studentName}
                </h4>

                <p className="mt-4 text-[22px]">has successfully completed</p>

                <h5 className="mt-4 text-[34px] font-extrabold uppercase text-[#1e3a8a]">
                  {course}
                </h5>

                <p className="mt-5 text-[18px]">
                  at <span className="font-semibold">{institution}</span>, awarded on this{' '}
                  <span className="font-semibold">{formattedDate}</span>.
                </p>

                <p className="mx-auto mt-6 max-w-[620px] text-[15px] leading-7 text-[#4b5563]">
                  This certificate is registered on the blockchain and serves as verifiable proof
                  of successful completion and authenticity.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 items-start gap-8">
                <div className="pt-4">
                  <p className="text-[18px] font-semibold">For {institution}</p>
                  <div className="mt-10 w-[190px] border-t-2 border-[#333]" />
                  <p className="mt-4 text-[18px] font-bold">{issuerName}</p>
                  <p className="text-[16px] text-[#555]">{issuerTitle}</p>
                </div>

                <div className="text-right">
                  <p className="mb-2 text-[18px] font-semibold">Scan to Verify</p>
                  <div className="inline-flex min-h-[180px] min-w-[180px] items-center justify-center rounded-lg border p-3">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Certificate QR"
                        width={150}
                        height={150}
                        className="block"
                      />
                    ) : (
                      <div className="h-[150px] w-[150px] bg-white" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t pt-4 text-[14px] text-[#374151]">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold">{institution}</p>
                    <p>contact@institution.org</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">Blockchain Certificate Hash</p>
                    <p className="break-all font-mono text-[11px] leading-5">
                      {certificateHash || 'Hash will appear here'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificatePreview.displayName = 'CertificatePreview';