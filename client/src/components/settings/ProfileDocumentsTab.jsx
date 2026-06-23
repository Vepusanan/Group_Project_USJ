import React from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { Feedback, Field, SectionHeader } from "./SettingsPrimitives";

const ProfileDocumentsTab = ({
  feedback,
  busy,
  pitchDeckFile,
  setPitchDeckFile,
  currentPitchDeckUrl,
  founderVideoFile,
  setFounderVideoFile,
  currentFounderVideoUrl,
  pitchDeckAnalysis,
  pitchDeckAnalysisLoading,
  pitchDeckAnalysisError,
  onSaveDocuments,
  onAnalyzePitchDeck,
}) => (
  <div>
    <Feedback feedback={feedback} />
    <SectionHeader
      title="Profile Settings"
      description="Manage investor-facing documents. Uploaded PDFs activate the in-platform pitch deck viewer."
    />

    <div className="space-y-6">
      <div id="documents">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-3">
          Documents
        </h3>
        <div className="space-y-4">
          <Field label="Pitch Deck (PDF)">
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setPitchDeckFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-content-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-line file:bg-surface-alt file:text-content-secondary"
            />
            <p className="text-xs text-content-muted mt-1">
              {pitchDeckFile
                ? `Selected: ${pitchDeckFile.name}`
                : currentPitchDeckUrl
                  ? "A pitch deck is already uploaded. Upload a new PDF to replace it."
                  : "Upload a PDF pitch deck for connected investors."}
            </p>
          </Field>

          <Field label="Founder Video Pitch (optional)">
            <input
              type="file"
              accept="video/mp4,.mp4"
              onChange={(e) => setFounderVideoFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-content-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-line file:bg-surface-alt file:text-content-secondary"
            />
            <p className="text-xs text-content-muted mt-1">
              {founderVideoFile
                ? `Selected: ${founderVideoFile.name}`
                : currentFounderVideoUrl
                  ? "A founder video is already uploaded."
                  : "Optional video pitch shown to connected investors."}
            </p>
          </Field>
        </div>
      </div>

      {currentPitchDeckUrl && (
        <div className="rounded-xl border border-line bg-surface-alt p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-content">Pitch deck AI feedback</h4>
              <p className="text-xs text-content-muted mt-0.5">
                Get structured feedback on sections, gaps, and improvements before
                investor meetings.
              </p>
            </div>
            <button
              type="button"
              onClick={onAnalyzePitchDeck}
              disabled={pitchDeckAnalysisLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-sm text-primary hover:bg-primary/15 disabled:opacity-50"
            >
              {pitchDeckAnalysisLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {pitchDeckAnalysisLoading ? "Analysing…" : "Analyse with AI"}
            </button>
          </div>
          {pitchDeckAnalysisError && (
            <p className="text-xs text-error">{pitchDeckAnalysisError}</p>
          )}
          {pitchDeckAnalysis && (
            <div className="text-sm text-content-secondary space-y-3 pt-2 border-t border-line">
              {pitchDeckAnalysis.summary && (
                <p className="text-content">{pitchDeckAnalysis.summary}</p>
              )}
              {pitchDeckAnalysis.missing_sections?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-content-muted uppercase tracking-wide mb-1">
                    Missing or weak sections
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    {pitchDeckAnalysis.missing_sections.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pitchDeckAnalysis.improvement_suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-content-muted uppercase tracking-wide mb-1">
                    Improvement suggestions
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    {pitchDeckAnalysis.improvement_suggestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveDocuments}
          disabled={busy === "profile"}
          className="px-4 py-2 rounded-lg bg-primary text-sm text-content-inverse disabled:opacity-50"
        >
          {busy === "profile" ? "Uploading…" : "Save Documents"}
        </button>
        <Link
          to="/profile/edit#investor-materials"
          className="px-4 py-2 rounded-lg border border-line text-sm text-content-secondary hover:text-content"
        >
          Edit all profile fields
        </Link>
      </div>
    </div>
  </div>
);

export default ProfileDocumentsTab;
