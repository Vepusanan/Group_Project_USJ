import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import profileService from "../../services/profileService";

const MatchExplanationBlock = ({
  startupProfileId,
  matchScore,
  compact = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (matchScore == null || Number.isNaN(Number(matchScore))) {
    return null;
  }

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    if (text) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setError("");
    const result = await profileService.getMatchExplanation(startupProfileId);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Unable to load match explanation");
      return;
    }

    setText(result.data?.explanation || "");
    setOpen(true);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50 ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3" />
        )}
        {open ? "Hide explanation" : "Why this match?"}
      </button>
      {error && (
        <p className={`mt-1 text-error ${compact ? "text-[11px]" : "text-xs"}`}>
          {error}
        </p>
      )}
      {open && text && (
        <p
          className={`mt-1.5 text-content-secondary leading-relaxed ${
            compact ? "text-[11px] line-clamp-4" : "text-sm"
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default MatchExplanationBlock;
