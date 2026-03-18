import React, { useState } from "react";
import { Plus, X, TrendingUp } from "lucide-react";

const InvestorStep5Portfolio = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: "",
    industry: "",
    stage: "",
    year: "",
  });

  const [newExitForm, setNewExitForm] = useState({
    company: "",
    exit_type: "",
    year: "",
    value: "",
  });

  const addPortfolioCompany = () => {
    if (newCompanyForm.name.trim()) {
      const company = {
        name: newCompanyForm.name,
        industry: newCompanyForm.industry || "",
        stage: newCompanyForm.stage || "",
        year: newCompanyForm.year ? parseInt(newCompanyForm.year) : null,
      };
      updateFormData({
        portfolio_companies: [...formData.portfolio_companies, company],
      });
      setNewCompanyForm({ name: "", industry: "", stage: "", year: "" });
    }
  };

  const addNotableExit = () => {
    if (newExitForm.company.trim()) {
      const exit = {
        company: newExitForm.company,
        exit_type: newExitForm.exit_type || "",
        year: newExitForm.year ? parseInt(newExitForm.year) : null,
        value: newExitForm.value || "",
      };
      updateFormData({
        notable_exits: [...formData.notable_exits, exit],
      });
      setNewExitForm({ company: "", exit_type: "", year: "", value: "" });
    }
  };

  const removePortfolioCompany = (index) => {
    updateFormData({
      portfolio_companies: formData.portfolio_companies.filter(
        (_, i) => i !== index
      ),
    });
  };

  const removeNotableExit = (index) => {
    updateFormData({
      notable_exits: formData.notable_exits.filter((_, i) => i !== index),
    });
  };

  const stages = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Late Stage", "IPO", "Acquired"];
  const exitTypes = ["Acquisition", "IPO", "Merger", "Secondary Sale", "Management Buyout"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Portfolio & Track Record
        </h2>
        <p className="text-gray-400">
          Share information about your investment portfolio and achievements
        </p>
      </div>

      {/* Portfolio Companies */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Portfolio Companies
        </label>
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Company name"
              value={newCompanyForm.name}
              onChange={(e) =>
                setNewCompanyForm({ ...newCompanyForm, name: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-sm"
            />
            <input
              type="text"
              placeholder="Industry (e.g., FinTech)"
              value={newCompanyForm.industry}
              onChange={(e) =>
                setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-sm"
            />
            <select
              value={newCompanyForm.stage}
              onChange={(e) =>
                setNewCompanyForm({ ...newCompanyForm, stage: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600 text-sm"
            >
              <option value="">Select stage</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Year"
              value={newCompanyForm.year}
              onChange={(e) =>
                setNewCompanyForm({ ...newCompanyForm, year: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addPortfolioCompany}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>

        {formData.portfolio_companies.length > 0 && (
          <div className="space-y-2 bg-gray-800/40 rounded-lg p-3">
            {formData.portfolio_companies.map((company, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2 bg-purple-600/20 border border-purple-600/30 rounded"
              >
                <div className="flex-1 text-sm">
                  <span className="text-purple-300 font-medium">{company.name}</span>
                  {company.industry && (
                    <span className="text-gray-400 ml-2">• {company.industry}</span>
                  )}
                  {company.stage && (
                    <span className="text-gray-400 ml-2">• {company.stage}</span>
                  )}
                  {company.year && (
                    <span className="text-gray-400 ml-2">({company.year})</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePortfolioCompany(index)}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notable Exits */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Notable Exits & Acquisitions
        </label>
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Company name"
              value={newExitForm.company}
              onChange={(e) =>
                setNewExitForm({ ...newExitForm, company: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-sm"
            />
            <select
              value={newExitForm.exit_type}
              onChange={(e) =>
                setNewExitForm({ ...newExitForm, exit_type: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600 text-sm"
            >
              <option value="">Select exit type</option>
              {exitTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Year"
              value={newExitForm.year}
              onChange={(e) =>
                setNewExitForm({ ...newExitForm, year: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-sm"
            />
            <input
              type="text"
              placeholder="Valuation/Price (optional)"
              value={newExitForm.value}
              onChange={(e) =>
                setNewExitForm({ ...newExitForm, value: e.target.value })
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addNotableExit}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Exit
          </button>
        </div>

        {formData.notable_exits.length > 0 && (
          <div className="space-y-2 bg-gray-800/40 rounded-lg p-3">
            {formData.notable_exits.map((exit, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2 bg-green-600/20 border border-green-600/30 rounded"
              >
                <div className="flex-1 text-sm">
                  <span className="text-green-300 font-medium">{exit.company}</span>
                  {exit.exit_type && (
                    <span className="text-gray-400 ml-2">• {exit.exit_type}</span>
                  )}
                  {exit.year && (
                    <span className="text-gray-400 ml-2">({exit.year})</span>
                  )}
                  {exit.value && (
                    <span className="text-gray-400 ml-2">• {exit.value}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeNotableExit(index)}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Investments Count */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Total Number of Investments *
        </label>
        <input
          type="number"
          min="0"
          value={formData.total_investments}
          onChange={(e) => {
            updateFormData({ total_investments: e.target.value });
            setErrors({ ...errors, total_investments: null });
          }}
          placeholder="e.g., 15"
          className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 ${
            errors.total_investments ? "border-red-600" : "border-gray-700"
          }`}
        />
        {errors.total_investments && (
          <p className="text-red-400 text-sm mt-1">{errors.total_investments}</p>
        )}
      </div>

      {/* Achievements */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Notable Achievements & Recognition
        </label>
        <textarea
          value={formData.notable_achievements}
          onChange={(e) =>
            updateFormData({ notable_achievements: e.target.value })
          }
          placeholder="Describe your investment achievements, awards, or recognitions"
          maxLength={500}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 resize-none h-20"
        />
        <span className="text-xs text-gray-500 mt-2 block">
          {formData.notable_achievements.length}/500 characters
        </span>
      </div>

      {/* Success Stats */}
      {(formData.total_investments ||
        formData.portfolio_companies.length > 0 ||
        formData.notable_exits.length > 0) && (
        <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-600/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-green-300">
              Your Investment Summary
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {formData.total_investments && (
              <div>
                <span className="text-gray-400">Total Investments</span>
                <p className="text-lg font-semibold text-green-300 mt-1">
                  {formData.total_investments}
                </p>
              </div>
            )}
            {formData.portfolio_companies.length > 0 && (
              <div>
                <span className="text-gray-400">Portfolio Companies</span>
                <p className="text-lg font-semibold text-green-300 mt-1">
                  {formData.portfolio_companies.length}
                </p>
              </div>
            )}
            {formData.notable_exits.length > 0 && (
              <div>
                <span className="text-gray-400">Successful Exits</span>
                <p className="text-lg font-semibold text-green-300 mt-1">
                  {formData.notable_exits.length}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">💡 Why this matters:</h3>
        <p className="text-sm text-gray-400">
          Your track record demonstrates your investment experience and success
          rate. Detailed portfolio information helps startups assess your
          credibility and past investments.
        </p>
      </div>
    </div>
  );
};

export default InvestorStep5Portfolio;
