"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  placeholders: Array<{ name: string; label: string; required: boolean; type: string }>;
  anchors: Array<{ name: string; label: string; tabType: string; required: boolean }>;
  defaultRoles: Array<{ roleName: string; signingOrder: number }>;
  defaultTabMap: Array<{ anchorName: string; roleName: string; tabType: string }>;
}

export default function NewRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [sourceType, setSourceType] = useState<"template" | "upload">("template");
  const [filledValues, setFilledValues] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Array<{ roleName: string; signingOrder: number }>>([]);
  const [tabMap, setTabMap] = useState<Array<{ anchorName: string; roleName: string; tabType: string }>>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [docusignFriendly, setDocusignFriendly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTemplates();
    }
  }, [session]);

  useEffect(() => {
    if (selectedTemplate) {
      setRoles(selectedTemplate.defaultRoles || []);
      setTabMap(selectedTemplate.defaultTabMap || []);
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/document-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setFilledValues({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let uploadedFileId = null;
      
      if (sourceType === "upload" && uploadedFile) {
        // Upload file first
        const formData = new FormData();
        formData.append("file", uploadedFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error("File upload failed");
        }
        const uploadData = await uploadRes.json();
        uploadedFileId = uploadData.fileId;
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTemplateId: sourceType === "template" ? selectedTemplate?.id : null,
          uploadedFileId,
          filledValues,
          roles,
          tabMap,
          docusignFriendly,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Request failed");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">DocuSign Template Generator</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/document-templates"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Document Templates
                </Link>
                <Link
                  href="/requests/new"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  New Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Template Request</h2>
            <p className="mt-1 text-sm text-gray-600">
              All documents automatically include the Fountain standard header.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Source Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Source
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="template"
                    checked={sourceType === "template"}
                    onChange={(e) => setSourceType(e.target.value as "template")}
                    className="mr-2"
                  />
                  Use Document Template
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="upload"
                    checked={sourceType === "upload"}
                    onChange={(e) => setSourceType(e.target.value as "upload")}
                    className="mr-2"
                  />
                  Upload Document
                </label>
              </div>
            </div>

            {/* Template Selection */}
            {sourceType === "template" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate?.id || ""}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  All templates are shared and available to all users
                </p>
              </div>
            )}

            {/* File Upload */}
            {sourceType === "upload" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document (PDF or DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  required
                />
              </div>
            )}

            {/* Placeholder Fields */}
            {selectedTemplate && selectedTemplate.placeholders && selectedTemplate.placeholders.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fill Placeholders
                </label>
                <div className="space-y-4">
                  {selectedTemplate.placeholders.map((placeholder) => (
                    <div key={placeholder.name}>
                      <label className="block text-sm text-gray-700">
                        {placeholder.label} {placeholder.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={placeholder.type === "date" ? "date" : placeholder.type === "number" ? "number" : "text"}
                        value={filledValues[placeholder.name] || ""}
                        onChange={(e) =>
                          setFilledValues({ ...filledValues, [placeholder.name]: e.target.value })
                        }
                        required={placeholder.required}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roles Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DocuSign Roles
              </label>
              <div className="space-y-2">
                {roles.map((role, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={role.roleName}
                      onChange={(e) => {
                        const newRoles = [...roles];
                        newRoles[index].roleName = e.target.value;
                        setRoles(newRoles);
                      }}
                      placeholder="Role name"
                      className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                    <input
                      type="number"
                      value={role.signingOrder}
                      onChange={(e) => {
                        const newRoles = [...roles];
                        newRoles[index].signingOrder = parseInt(e.target.value);
                        setRoles(newRoles);
                      }}
                      placeholder="Signing order"
                      min="1"
                      className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setRoles(roles.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRoles([...roles, { roleName: "", signingOrder: roles.length + 1 }])}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add Role
                </button>
              </div>
            </div>

            {/* Tab Mapping */}
            {selectedTemplate && selectedTemplate.anchors && selectedTemplate.anchors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map Anchors to Roles
                </label>
                <div className="space-y-2">
                  {selectedTemplate.anchors.map((anchor) => {
                    const existingMapping = tabMap.find(m => m.anchorName === anchor.name);
                    return (
                      <div key={anchor.name} className="flex items-center space-x-2">
                        <span className="w-1/3 text-sm text-gray-700">{anchor.label}</span>
                        <select
                          value={existingMapping?.roleName || ""}
                          onChange={(e) => {
                            const newTabMap = tabMap.filter(m => m.anchorName !== anchor.name);
                            if (e.target.value) {
                              newTabMap.push({
                                anchorName: anchor.name,
                                roleName: e.target.value,
                                tabType: anchor.tabType,
                              });
                            }
                            setTabMap(newTabMap);
                          }}
                          className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select role...</option>
                          {roles.map((role) => (
                            <option key={role.roleName} value={role.roleName}>
                              {role.roleName}
                            </option>
                          ))}
                        </select>
                        <span className="w-1/3 text-sm text-gray-500">{anchor.tabType}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DocuSign Friendly Option */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    DocuSign Friendly
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Optimize the document for better DocuSign signature placement and anchor detection. 
                    This ensures proper spacing, searchable text, and improved compatibility.
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docusignFriendly}
                      onChange={(e) => setDocusignFriendly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
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
      </main>
    </div>
  );
}





