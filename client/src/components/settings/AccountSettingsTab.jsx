import React from "react";
import { Loader2 } from "lucide-react";
import { Feedback, SectionHeader, inputCls } from "./SettingsPrimitives";

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString([], { dateStyle: "medium" })
    : "—";

const AccountSettingsTab = ({
  user,
  role,
  feedback,
  accountForm,
  setAccountForm,
  busy,
  onChangeEmail,
  onDeleteAccount,
}) => (
  <div className="space-y-5">
    <SectionHeader title="Account Settings" />
    <Feedback feedback={feedback} />

    <div className="rounded-lg border border-line p-4 space-y-3">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
        Account Status
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-alt px-3 py-2">
          <p className="text-xs text-content-muted">Email</p>
          <p className="text-sm text-content mt-0.5">{user?.email || "—"}</p>
        </div>
        <div className="rounded-lg bg-surface-alt px-3 py-2">
          <p className="text-xs text-content-muted">User Type</p>
          <p className="text-sm text-content mt-0.5 capitalize">{role}</p>
          <p className="text-[10px] text-content-muted mt-0.5">
            To change type, create a new account
          </p>
        </div>
        <div className="rounded-lg bg-surface-alt px-3 py-2">
          <p className="text-xs text-content-muted">Member Since</p>
          <p className="text-sm text-content mt-0.5">
            {fmtDate(user?.createdAt || user?.created_at)}
          </p>
        </div>
      </div>
    </div>

    <form onSubmit={onChangeEmail} className="rounded-lg border border-line p-4 space-y-3">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
        Change Email
      </h3>
      <p className="text-xs text-content-muted">
        A verification email will be sent to the new address. Your old email will
        be notified.
      </p>
      <input
        className={inputCls}
        type="email"
        value={accountForm.newEmail}
        onChange={(e) =>
          setAccountForm((prev) => ({ ...prev, newEmail: e.target.value }))
        }
        placeholder="New email address"
        required
      />
      <button
        type="submit"
        disabled={!!busy}
        className="px-4 py-2 rounded-lg bg-primary text-sm text-content-inverse disabled:opacity-50 inline-flex items-center gap-2"
      >
        {busy === "account.email" && <Loader2 className="w-4 h-4 animate-spin" />}
        Request Email Change
      </button>
    </form>

    <form
      onSubmit={onDeleteAccount}
      className="rounded-lg border border-error/40 bg-error/5 p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-error uppercase tracking-wide">
        Delete Account
      </h3>
      <p className="text-xs text-error/70">
        Your account will be deactivated immediately. After 30 days all data is
        permanently deleted.
      </p>
      <input
        className={`${inputCls} border-error/30`}
        type="password"
        value={accountForm.deletePassword}
        onChange={(e) =>
          setAccountForm((prev) => ({ ...prev, deletePassword: e.target.value }))
        }
        placeholder="Confirm your password"
        required
      />
      <button
        type="submit"
        disabled={!!busy}
        className="px-4 py-2 rounded-lg bg-error text-sm text-content-inverse disabled:opacity-50 inline-flex items-center gap-2"
      >
        {busy === "account.delete" && <Loader2 className="w-4 h-4 animate-spin" />}
        Delete My Account
      </button>
    </form>
  </div>
);

export default AccountSettingsTab;
