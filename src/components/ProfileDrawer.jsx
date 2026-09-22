import { useEffect, useRef, useState } from 'react';
import { Underline, Tape } from './paper';
import { student } from '../data/fixtures';
import { uploadStudentResume, getStudentResume, pollStudentResume, deleteStudentResume } from '../lib/api';

const fmtSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const fmtWhen = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

export default function ProfileDrawer({ open, onClose, user, practiceCount }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [resume, setResume] = useState(null);

  // Pull whatever resume this student already has on file (real backend now,
  // not localStorage - the same upload is what StickyWall.jsx's note wall
  // reads too, see api/students.py).
  useEffect(() => {
    if (!user?.id) { setResume(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await getStudentResume(user.id);
        if (!cancelled && r.status === 'ready') {
          setResume({ name: r.original_filename, formattedSize: null, uploadedAt: r.updated_at ? fmtWhen(r.updated_at) : '' });
        }
      } catch {
        // 404 - no resume on file yet; leave the dropzone showing
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleFile = async (file) => {
    setUploadError('');
    setValidationError(null);
    if (!file || !user?.id) return;

    const isPdfOrDocx = file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx');
    if (!isPdfOrDocx) {
      setUploadError('Please upload a valid PDF (.pdf) or Word document (.docx).');
      return;
    }

    setIsValidating(true);
    try {
      // The backend runs the real check (same local heuristic the
      // per-session resume upload uses) and rejects with a specific reason
      // on 400/413/422 - no separate client-side pre-check needed.
      await uploadStudentResume(user.id, file);
      const result = await pollStudentResume(user.id);

      if (!result || result.status !== 'ready') {
        setValidationError({
          fileName: file.name,
          reason: result?.reject_reason || 'Could not analyze this file - please try again.',
        });
        return;
      }

      setResume({ name: file.name, formattedSize: fmtSize(file.size), uploadedAt: fmtWhen(new Date().toISOString()) });
    } catch (err) {
      setValidationError({ fileName: file.name, reason: err.message || 'Upload failed.' });
    } finally {
      setIsValidating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploadError('');
    setValidationError(null);
    setResume(null);
    if (!user?.id) return;
    try {
      await deleteStudentResume(user.id);
    } catch {
      // already gone or unreachable - the UI already reflects "no resume"
    }
  };

  const handleReplace = () => {
    setUploadError('');
    setValidationError(null);
    fileInputRef.current?.click();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const displayName = user?.name || student.name;
  const displayEmail = user?.email || student.email || 'deepak.bathirachalam@university.edu';
  const displayYear = user?.year || student.year;
  const displayBranch = user?.branch || student.branch;
  const readiness = user?.dataLoaded ? user.overall : student.readiness;
  const count = practiceCount ?? student.practices;

  return (
    <div
      className="profile-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-drawer-title"
    >
      <aside
        className="profile-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Student Profile & Resume"
      >
        <button className="x" type="button" onClick={onClose} aria-label="Close profile drawer">
          ✕
        </button>

        {/* Eyebrow & Drawer Title */}
        <div className="profile-header">
          <p className="eyebrow" style={{ color: '#B0403A' }}>STUDENT ACCOUNT</p>
          <h2 id="profile-drawer-title" className="profile-title">
            Your Profile & Resume
            <Underline stroke="#C0483E" />
          </h2>
        </div>

        {/* Profile Details Card */}
        <div className="profile-card">
          <div className="profile-avatar-lg" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h3 className="profile-name">{displayName}</h3>
            <p className="profile-degree">{displayYear} · {displayBranch}</p>
            <div className="profile-meta-tags">
              <span className="profile-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {displayEmail}
              </span>
              <span className="profile-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                {count} Practices Completed
              </span>
              <span className="profile-tag readiness">
                {readiness == null ? 'Not yet rated' : `★ ${readiness}% Interview Readiness`}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Resume Management Section */}
        <div className="resume-section">
          <div className="section-head">
            <p className="eyebrow">DOCUMENT MANAGEMENT</p>
            <h3 className="section-title">Resume Management</h3>
            <p className="section-subtitle">
              Upload your latest resume. Voiceprint scans your bullet points for repetitive verbs, missing metrics, and ATS keyword gaps.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />

          {resume ? (
            <div className="active-resume-container">
              {/* Green Visual Feedback Badge */}
              <div className="active-resume-badge" role="status">
                <span className="active-pulse-dot" />
                <span>Active Resume: <strong>{resume.name}</strong></span>
              </div>

              <div className="resume-file-card">
                <div className="file-icon-box" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="file-info">
                  <p className="file-title">{resume.name}</p>
                  <p className="file-meta">
                    {resume.formattedSize ? `${resume.formattedSize} · ` : ''}Uploaded {resume.uploadedAt}
                  </p>
                </div>
              </div>

              <div className="resume-button-row">
                <button type="button" className="btn" onClick={handleReplace}>
                  REPLACE RESUME
                </button>
                <button type="button" className="btn ghost" onClick={handleRemove}>
                  REMOVE
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`resume-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              aria-label="Upload resume file dropzone"
            >
              <div className="dropzone-icon" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="dropzone-text">
                <strong>Click to browse</strong> or drag & drop your resume
              </p>
              <p className="dropzone-hint">
                Accepted formats: <strong>.pdf</strong> or <strong>.docx</strong>
              </p>
            </div>
          )}

          {isValidating && (
            <div className="resume-validating-msg" role="status">
              <span className="validating-spinner" />
              <span>Scanning document structure and verifying resume signals...</span>
            </div>
          )}

          {uploadError && (
            <p className="upload-error-msg" role="alert">
              {uploadError}
            </p>
          )}

          {validationError && (
            <div className="resume-rejection-banner" role="alert">
              <div className="rejection-head">
                <span className="rejection-icon" aria-hidden="true">✕</span>
                <div className="rejection-title-box">
                  <h4 className="rejection-title">
                    Upload rejected: This file does not appear to be a valid resume
                  </h4>
                  <p className="rejection-sub">
                    File <strong>“{validationError.fileName}”</strong>: {validationError.reason}
                  </p>
                </div>
                <button
                  type="button"
                  className="rejection-close"
                  onClick={() => setValidationError(null)}
                  aria-label="Dismiss rejection banner"
                >
                  ✕
                </button>
              </div>

              <p className="rejection-hint">
                Tip: Ensure your resume includes standard sections (Experience, Education, Skills, Projects), contact details, and dates before uploading.
              </p>
            </div>
          )}
        </div>

        {/* Vintage Coach Note Footer */}
        <div className="profile-note-slip">
          <Tape rotate={-2} />
          <p className="coach-quote">“{student.focusQuote}”</p>
        </div>
      </aside>
    </div>
  );
}
