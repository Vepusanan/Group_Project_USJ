import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Columns3,
  FileText,
  GripVertical,
  Kanban,
  ListChecks,
  StickyNote,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import {
  cardClass,
  pageContainerClass,
  pageContentClass,
  pageEyebrowClass,
  pageHeadingClass,
  pageSubheadingClass,
} from "../styles/theme";
import TrendChart from "../components/analytics/TrendChart";
import {
  ANALYTICS_PERIODS,
  dealPipelineService,
  PIPELINE_STAGES,
} from "../services/dealPipelineService";
import IntentLevelControl from "../components/investor/IntentLevelControl";
import PipelineCardNotesPanel from "../components/dealPipeline/PipelineCardNotesPanel";
import WatchlistSection from "../components/investor/WatchlistSection";

const STAGE_LABELS = {
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C: "Series C",
  SERIES_D_PLUS: "Series D+",
};

const formatStageDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const PipelineCard = ({
  card,
  onOpenNotes,
  isDragging,
  onDragStart,
  onIntentChange,
  showCompare,
  isSelectedForCompare,
  onToggleCompare,
}) => (
  <div
    draggable={!card.is_passed_without_connection && !card.is_discovered_without_connection}
    onDragStart={(e) => {
      if (card.is_passed_without_connection || card.is_discovered_without_connection) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/card-id", card.id);
      e.dataTransfer.effectAllowed = "move";
      onDragStart?.(card.id);
    }}
    onDragEnd={() => onDragStart?.(null)}
    className={`${cardClass} p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
      isDragging ? "opacity-50 ring-2 ring-primary/40" : ""
    }`}
  >
    <div className="flex items-start gap-2.5">
      <GripVertical className="w-4 h-4 text-content-muted/60 shrink-0 mt-1" />
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header: logo + name */}
        <div className="flex items-center gap-2.5">
          {card.startup_logo_url ? (
            <img
              src={card.startup_logo_url}
              alt=""
              className="w-9 h-9 rounded-lg object-cover border border-line shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {(card.startup_name || "S").charAt(0)}
            </div>
          )}
          <Link
            to={`/startups/${card.startup_profile_id}`}
            className="font-semibold text-sm text-content hover:text-primary truncate leading-tight"
            onClick={(e) => e.stopPropagation()}
          >
            {card.startup_name || "Startup"}
          </Link>
        </div>

        {/* Meta chips: industry + funding stage */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-surface-alt border border-line px-2 py-0.5 text-[11px] font-medium text-content-secondary">
            {card.industry || "Industry N/A"}
          </span>
          <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
            {STAGE_LABELS[card.funding_stage] || card.funding_stage || "Stage N/A"}
          </span>
        </div>

        <p className="text-[10px] text-content-muted">
          In stage since {formatStageDate(card.stage_entered_at)}
        </p>

        {/* Intent control */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <IntentLevelControl
            connectionId={card.connection_id}
            value={card.intent_level}
            onChange={(level) => onIntentChange?.(card.id, level)}
            compact
          />
        </div>

        {card.decision_outcome && (
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {card.decision_outcome === "INVEST"
              ? "Proceed to invest"
              : card.decision_outcome === "DEFER"
                ? "Deferred"
                : "Passed"}
          </span>
        )}

        {/* Footer: compare + notes, divided from body */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
          {showCompare ? (
            <label className="inline-flex items-center gap-1.5 text-[11px] text-content-muted cursor-pointer hover:text-content">
              <input
                type="checkbox"
                checked={isSelectedForCompare}
                onChange={() => onToggleCompare?.(card.startup_profile_id)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-line"
              />
              Compare
            </label>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onOpenNotes(card)}
            className="inline-flex items-center gap-1 text-[11px] text-content-muted hover:text-primary"
          >
            <StickyNote className="w-3 h-3" />
            {card.private_notes ? "Note saved" : "Notes"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const DealPipelinePage = () => {
  const navigate = useNavigate();
  const [cardsByStage, setCardsByStage] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [notesCard, setNotesCard] = useState(null);
  const [notesPromptDd, setNotesPromptDd] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [period, setPeriod] = useState("30d");

  const toggleCompareSelection = (startupProfileId) => {
    setCompareIds((prev) => {
      const id = String(startupProfileId);
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleIntentChange = (cardId, intentLevel) => {
    setCardsByStage((prev) => {
      const next = {};
      for (const [stage, cards] of Object.entries(prev)) {
        next[stage] = cards.map((card) =>
          card.id === cardId ? { ...card, intent_level: intentLevel } : card,
        );
      }
      return next;
    });
  };

  const loadPipeline = useCallback(
    async ({ silent = false } = {}) => {
      // `silent` skips the full-page spinner so a background refresh (e.g. after
      // a drag-drop) updates the cards/stats in place instead of flashing the
      // whole board.
      if (!silent) setLoading(true);
      setError("");
      const result = await dealPipelineService.getPipeline(period);
      if (!result.success) {
        setError(result.error);
        if (!silent) setLoading(false);
        return;
      }
      setCardsByStage(result.data.cards_by_stage || {});
      setStats(result.data.stats || null);
      if (!silent) setLoading(false);
    },
    [period],
  );

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const handleDrop = async (targetStage, e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/card-id");
    setDraggingId(null);
    if (!cardId) return;

    let sourceStage = null;
    let sourceCard = null;
    for (const [stage, cards] of Object.entries(cardsByStage)) {
      const found = cards.find((card) => card.id === cardId);
      if (found) {
        sourceStage = stage;
        sourceCard = found;
        break;
      }
    }

    if (!sourceStage || sourceStage === targetStage) return;

    // Optimistic move: update local state immediately so only the cards shift,
    // not the whole page. Snapshot first so we can revert if the API fails.
    const previousState = cardsByStage;
    setCardsByStage((prev) => {
      const next = {};
      for (const [stage, cards] of Object.entries(prev)) {
        next[stage] = cards.filter((card) => card.id !== cardId);
      }
      next[targetStage] = [
        ...(next[targetStage] || []),
        { ...sourceCard, stage_entered_at: new Date().toISOString() },
      ];
      return next;
    });

    const result = await dealPipelineService.moveCard(cardId, targetStage);
    if (!result.success) {
      setError(result.error);
      setCardsByStage(previousState); // revert
      return;
    }
    // Background refresh to sync stats + server-computed fields, no spinner.
    loadPipeline({ silent: true });

    if (
      targetStage === "DECISION" &&
      sourceStage === "DUE_DILIGENCE" &&
      sourceCard
    ) {
      setNotesCard({
        ...sourceCard,
        private_notes: sourceCard.private_notes || "",
      });
      setNotesPromptDd(true);
    }
  };

  const handleNotesSaved = (updatedCard) => {
    if (!updatedCard?.id) return;
    setCardsByStage((prev) => {
      const next = {};
      for (const [stage, cards] of Object.entries(prev)) {
        next[stage] = cards.map((card) =>
          card.id === updatedCard.id
            ? {
                ...card,
                private_notes: updatedCard.private_notes,
                decision_outcome: updatedCard.decision_outcome,
              }
            : card,
        );
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className={pageContainerClass}>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={pageContainerClass}>
      <div className={`${pageContentClass} space-y-6 pb-12`}>
        <div>
          <span className={pageEyebrowClass}>Active Dealflow</span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className={pageHeadingClass}>Analytics</h1>
              <p className={pageSubheadingClass}>
                Track your deal flow across stages and review your saved watchlist.
              </p>
            </div>
            <div className="flex rounded-xl border border-outline-variant/40 bg-surface-container p-1">
              {ANALYTICS_PERIODS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    period === opt.value
                      ? "bg-primary text-white font-medium"
                      : "text-content-secondary hover:text-content"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/compare?ids=${compareIds.join(",")}`)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-content-inverse text-sm"
            >
              <Columns3 className="w-4 h-4" />
              Compare {compareIds.length} startup{compareIds.length > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.id}
                className={`rounded-xl border p-3 ${stage.color}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-content-muted">
                  {stage.label}
                </p>
                <p className="text-2xl font-bold text-content mt-1">
                  {stats.deals_per_stage?.[stage.id] ?? 0}
                </p>
                {stats.avg_days_per_stage?.[stage.id] != null && (
                  <p className="text-[10px] text-content-muted mt-1">
                    ~{stats.avg_days_per_stage[stage.id]}d avg
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-xl border border-line bg-surface p-4">
                <Users className="w-4 h-4 text-primary mb-2" />
                <p className="text-xs text-content-muted">Active in pipeline</p>
                <p className="text-2xl font-bold text-content">{stats.total_active ?? 0}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <FileText className="w-4 h-4 text-primary mb-2" />
                <p className="text-xs text-content-muted">Pitch decks reviewed</p>
                <p className="text-2xl font-bold text-content">
                  {stats.pitch_decks_reviewed?.total_sessions ?? 0}
                </p>
                <p className="text-[10px] text-content-muted mt-1">
                  {stats.pitch_decks_reviewed?.unique_startups ?? 0} startups
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <ListChecks className="w-4 h-4 text-primary mb-2" />
                <p className="text-xs text-content-muted">DD checklists</p>
                <p className="text-2xl font-bold text-content">
                  {stats.due_diligence?.checklists_created ?? 0}
                </p>
                <p className="text-[10px] text-content-muted mt-1">
                  {stats.due_diligence?.avg_completion_rate != null
                    ? `${stats.due_diligence.avg_completion_rate}% avg completion`
                    : "No items yet"}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <Video className="w-4 h-4 text-primary mb-2" />
                <p className="text-xs text-content-muted">Meetings scheduled</p>
                <p className="text-2xl font-bold text-content">
                  {stats.meetings?.total_scheduled ?? 0}
                </p>
                <p className="text-[10px] text-content-muted mt-1">
                  {stats.meetings?.acceptance_rate != null
                    ? `${stats.meetings.acceptance_rate}% acceptance`
                    : `${stats.meetings?.accepted ?? 0} accepted`}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <TrendingUp className="w-4 h-4 text-primary mb-2" />
                <p className="text-xs text-content-muted">New cards this month</p>
                <p className="text-2xl font-bold text-content">
                  {stats.pipeline_velocity?.new_cards_this_month ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <BarChart3 className="w-4 h-4 text-primary mb-2" />
                <p className="text-xs text-content-muted">Stage moves (30d)</p>
                <p className="text-2xl font-bold text-content">
                  {stats.pipeline_velocity?.stage_moves_last_30_days ?? 0}
                </p>
              </div>
            </div>

            {stats.stage_conversion && (
              <div className="rounded-xl border border-line bg-surface-alt p-4">
                <p className="text-sm font-semibold text-content mb-3">Stage conversion rates</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(stats.stage_conversion).map((row) => (
                    <div key={row.from_stage} className="rounded-lg border border-line bg-surface px-3 py-2">
                      <p className="text-[10px] text-content-muted uppercase">
                        {PIPELINE_STAGES.find((s) => s.id === row.from_stage)?.label || row.from_stage}
                        {" → "}
                        {PIPELINE_STAGES.find((s) => s.id === row.to_stage)?.label || row.to_stage}
                      </p>
                      <p className="text-lg font-bold text-content mt-1">
                        {row.conversion_rate != null ? `${row.conversion_rate}%` : "—"}
                      </p>
                      <p className="text-[10px] text-content-muted">
                        {row.advanced}/{row.entered} advanced
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrendChart
                title="New pipeline cards per month"
                series={stats.pipeline_velocity?.new_cards_per_month}
              />
              <TrendChart
                title="Watchlist adds per month"
                series={stats.watchlist?.adds_per_month}
                emptyLabel="No watchlist activity yet"
              />
            </div>
          </>
        )}

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.id}
                className="w-72 shrink-0"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => handleDrop(stage.id, e)}
              >
                <div className="rounded-t-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 border-b-0">
                  <h2 className="font-headline text-headline-md text-on-surface">{stage.label}</h2>
                  <p className="font-label text-label-caps uppercase tracking-wider text-outline text-[10px] mt-1">
                    {(cardsByStage[stage.id] || []).length} deal
                    {(cardsByStage[stage.id] || []).length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="min-h-[320px] rounded-b-2xl border border-outline-variant/40 bg-surface-container-low p-3 space-y-3 custom-scrollbar">
                  {(cardsByStage[stage.id] || []).length === 0 ? (
                    <p className="text-xs text-content-muted text-center py-8">
                      Drop cards here
                    </p>
                  ) : (
                    (cardsByStage[stage.id] || []).map((card) => (
                      <PipelineCard
                        key={card.id}
                        card={card}
                        isDragging={draggingId === card.id}
                        onDragStart={setDraggingId}
                        onIntentChange={handleIntentChange}
                        onOpenNotes={(c) => {
                          setNotesCard(c);
                          setNotesPromptDd(false);
                        }}
                        showCompare
                        isSelectedForCompare={compareIds.includes(
                          String(card.startup_profile_id),
                        )}
                        onToggleCompare={toggleCompareSelection}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <WatchlistSection />
        </div>
      </div>

      {notesCard && (
        <PipelineCardNotesPanel
          card={notesCard}
          promptDdSummary={notesPromptDd}
          showDecisionGuidance={notesPromptDd}
          onClose={() => {
            setNotesCard(null);
            setNotesPromptDd(false);
          }}
          onSaved={handleNotesSaved}
        />
      )}
    </div>
  );
};

export default DealPipelinePage;
