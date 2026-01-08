"use client";

import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";

interface Placeholder {
  name: string;
  label: string;
  required: boolean;
  type: "text" | "date" | "number";
}

interface Anchor {
  name: string;
  label: string;
  tabType: "signature" | "date" | "text" | "checkbox" | "radio";
  required: boolean;
}

export default function NewTemplatePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [defaultRoles, setDefaultRoles] = useState<Array<{ roleName: string; signingOrder: number }>>([]);
  const [defaultTabMap, setDefaultTabMap] = useState<Array<{ anchorName: string; roleName: string; tabType: string }>>([]);

  const addPlaceholder = () => {
    setPlaceholders([
      ...placeholders,
      { name: "", label: "", required: false, type: "text" },
    ]);
  };

  const removePlaceholder = (index: number) => {
    setPlaceholders(placeholders.filter((_, i) => i !== index));
  };

  const updatePlaceholder = (index: number, field: keyof Placeholder, value: any) => {
    const updated = [...placeholders];
    updated[index] = { ...updated[index], [field]: value };
    setPlaceholders(updated);
  };

  const addAnchor = () => {
    setAnchors([
      ...anchors,
      { name: "", label: "", tabType: "signature", required: false },
    ]);
  };

  const removeAnchor = (index: number) => {
    setAnchors(anchors.filter((_, i) => i !== index));
  };

  const updateAnchor = (index: number, field: keyof Anchor, value: any) => {
    const updated = [...anchors];
    updated[index] = { ...updated[index], [field]: value };
    setAnchors(updated);
  };

  const addDefaultRole = () => {
    setDefaultRoles([
      ...defaultRoles,
      { roleName: "", signingOrder: defaultRoles.length + 1 },
    ]);
  };

  const removeDefaultRole = (index: number) => {
    setDefaultRoles(defaultRoles.filter((_, i) => i !== index));
  };

  const updateDefaultRole = (index: number, field: string, value: any) => {
    const updated = [...defaultRoles];
    updated[index] = { ...updated[index], [field]: value };
    setDefaultRoles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!name || !category || !templateFile) {
        throw new Error("Name, category, and template file are required");
      }

      // Upload template file
      const formData = new FormData();
      formData.append("file", templateFile);
      formData.append("type", "template");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "File upload failed");
      }

      const uploadData = await uploadRes.json();

      // Create template
      const templateRes = await fetch("/api/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          filePath: uploadData.filePath,
          placeholders: placeholders.filter(p => p.name && p.label),
          anchors: anchors.filter(a => a.name && a.label),
          defaultRoles: defaultRoles.filter(r => r.roleName),
          defaultTabMap: defaultTabMap,
        }),
      });

      if (!templateRes.ok) {
        const errorData = await templateRes.json();
        throw new Error(errorData.error || "Template creation failed");
      }

      window.location.href = "/document-templates";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Template</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload a document template and configure placeholders and DocuSign anchors.
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Templates you create will be available to all users in the system.
            </p>
          </div>
        </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Letter of Recommendation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Recommendation, Verification, Agreement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template File (DOCX or PDF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".docx,.pdf"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use {'{{VAR:PLACEHOLDER_NAME}}'} for placeholders and {'{{DS:ANCHOR_NAME}}'} for DocuSign anchors
                </p>
              </div>
            </div>

            {/* Placeholders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Placeholders</h3>
                <button
                  type="button"
                  onClick={addPlaceholder}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add Placeholder
                </button>
              </div>

              {placeholders.length === 0 && (
                <p className="text-sm text-gray-500">No placeholders defined. Add placeholders that will be replaced in the document.</p>
              )}

              {placeholders.map((placeholder, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Placeholder {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removePlaceholder(index)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Name (VAR:NAME)</label>
                      <input
                        type="text"
                        value={placeholder.name}
                        onChange={(e) => updatePlaceholder(index, "name", e.target.value.toUpperCase().replace(/\s/g, "_"))}
                        placeholder="FULL_NAME"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Label</label>
                      <input
                        type="text"
                        value={placeholder.label}
                        onChange={(e) => updatePlaceholder(index, "label", e.target.value)}
                        placeholder="Full Name"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Type</label>
                      <select
                        value={placeholder.type}
                        onChange={(e) => updatePlaceholder(index, "type", e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={placeholder.required}
                        onChange={(e) => updatePlaceholder(index, "required", e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label className="ml-2 text-xs text-gray-600">Required</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Anchors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">DocuSign Anchors</h3>
                <button
                  type="button"
                  onClick={addAnchor}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add Anchor
                </button>
              </div>

              {anchors.length === 0 && (
                <p className="text-sm text-gray-500">No anchors defined. Add anchors for DocuSign tab placement.</p>
              )}

              {anchors.map((anchor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Anchor {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeAnchor(index)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Name (DS:NAME)</label>
                      <input
                        type="text"
                        value={anchor.name}
                        onChange={(e) => updateAnchor(index, "name", e.target.value.toUpperCase().replace(/\s/g, "_"))}
                        placeholder="SIGNATURE_CONTRACTOR"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Label</label>
                      <input
                        type="text"
                        value={anchor.label}
                        onChange={(e) => updateAnchor(index, "label", e.target.value)}
                        placeholder="Contractor Signature"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tab Type</label>
                      <select
                        value={anchor.tabType}
                        onChange={(e) => updateAnchor(index, "tabType", e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="signature">Signature</option>
                        <option value="date">Date</option>
                        <option value="text">Text</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={anchor.required}
                        onChange={(e) => updateAnchor(index, "required", e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label className="ml-2 text-xs text-gray-600">Required</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Default Roles (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Default Roles (Optional)</h3>
                  <p className="text-xs text-gray-500">Pre-configure signing roles for this template</p>
                </div>
                <button
                  type="button"
                  onClick={addDefaultRole}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add Role
                </button>
              </div>

              {defaultRoles.map((role, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={role.roleName}
                    onChange={(e) => updateDefaultRole(index, "roleName", e.target.value)}
                    placeholder="Role name"
                    className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    value={role.signingOrder}
                    onChange={(e) => updateDefaultRole(index, "signingOrder", parseInt(e.target.value))}
                    placeholder="Signing order"
                    min="1"
                    className="block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeDefaultRole(index)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Link
                href="/document-templates"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Template"}
              </button>
            </div>
          </form>
        </div>
      </Layout>
  );
}

