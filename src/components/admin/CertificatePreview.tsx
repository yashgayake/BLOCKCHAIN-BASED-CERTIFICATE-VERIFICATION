import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

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
      issuerName = 'Registrar',
      issuerTitle = 'Authorized Signatory'
    },
    ref
  ) => {
    const formattedDate = issueDate
      ? new Date(issueDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : '';

    return (
      <div
        ref={ref}
        className="mx-auto w-full max-w-4xl rounded-2xl border bg-[#fcfbf7] p-6 shadow-sm"
      >
        <div className="border-4 border-[#b89552] p-2">
          <div className="border-2 border-[#b89552] px-6 py-8 md:px-10 md:py-10">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#b89552] bg-white">
                <div className="text-center leading-tight">
                  <div className="text-lg font-bold text-[#1d3557]">BC</div>
                  <div className="text-[10px] text-[#b89552]">CHAIN</div>
                </div>
              </div>

              <h1 className="text-3xl font-bold tracking-wide text-[#1d3557] md:text-5xl">
                {institution || 'INSTITUTE NAME'}
              </h1>

              <div className="mx-auto my-4 h-[2px] w-40 bg-[#b89552]" />

              <h2 className="text-4xl font-serif tracking-[0.2em] text-black md:text-6xl">
                CERTIFICATE
              </h2>

              <div className="mx-auto my-5 h-[1px] w-56 bg-[#c7b187]" />

              <p className="text-base font-semibold text-[#5c4521] md:text-xl">
                Certificate No: <span className="font-bold">{certificateNumber}</span>
              </p>
            </div>

            <div className="mt-10 text-center">
              <h3 className="text-2xl font-bold uppercase underline underline-offset-4 md:text-3xl">
                To Whom It May Concern
              </h3>

              <p className="mt-8 text-xl text-[#333] md:text-3xl">
                This is to certify that
              </p>

              <h4 className="mt-5 text-4xl font-bold uppercase tracking-wide text-black md:text-6xl">
                {studentName || 'STUDENT NAME'}
              </h4>

              <p className="mt-5 text-xl text-[#333] md:text-3xl">
                has successfully completed
              </p>

              <h5 className="mt-5 text-3xl font-bold text-black md:text-5xl">
                {course || 'Course Name'}
              </h5>

              <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#2f2f2f] md:text-2xl md:leading-10">
                at <span className="font-semibold">{institution || 'Institute Name'}</span>,
                awarded on this <span className="font-semibold">{formattedDate || 'Issue Date'}</span>.
              </p>

              <p className="mx-auto mt-8 max-w-3xl text-base leading-7 text-[#444] md:text-xl md:leading-9">
                This certificate is registered on the blockchain and serves as verifiable
                proof of successful completion and authenticity.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-2">
              <div>
                <p className="mb-12 text-xl font-semibold text-[#333]">
                  For {institution || 'Institute'}
                </p>

                <div className="w-40 border-b-2 border-black" />
                <p className="mt-3 text-xl font-bold">{issuerName}</p>
                <p className="text-lg text-[#444]">{issuerTitle}</p>
              </div>

              <div className="text-left md:text-right">
                <p className="mb-2 text-lg font-semibold text-[#333]">Scan to Verify</p>
                <div className="inline-block rounded-lg border bg-white p-3">
                <QRCodeSVG
  value={`${window.location.origin}/verify?hash=${certificateHash || 'preview-hash'}`}
  size={180}
  level="H"
  includeMargin={true}
/>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t pt-6 text-sm text-[#333] md:text-base">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="font-semibold">{institution || 'Institute Name'}</p>
                  <p>contact@institution.org</p>
                </div>

                <div className="break-all md:text-right">
                  <p className="font-semibold">Blockchain Certificate Hash</p>
                  <p className="font-mono text-xs md:text-sm">
                    {certificateHash || 'Hash will appear here'}
                  </p>
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