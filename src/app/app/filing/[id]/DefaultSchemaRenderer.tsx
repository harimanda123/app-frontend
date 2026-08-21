/**
 * Default Schema Renderer Component
 * 
 * Fallback renderer when no UI configuration exists.
 * Automatically generates a form from JSON schema structure.
 * Handles nested objects and arrays with basic field inference.
 */

"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SchemaField {
  type: string;
  description?: string;
  enum?: string[];
  format?: string;
  items?: any;
  properties?: Record<string, any>;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

interface DefaultSchemaRendererProps {
  schema: any;
  data: Record<string, any>;
  onChange: (fieldPath: string, value: any) => void;
  onSave?: () => void;
  readOnly?: boolean;
  maxDepth?: number;
}

export default function DefaultSchemaRenderer({
  schema,
  data,
  onChange,
  onSave,
  readOnly = false,
  maxDepth = 3,
}: DefaultSchemaRendererProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["root"]));

  // Toggle section expansion
  const toggleSection = (path: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedSections(newExpanded);
  };

  // Get nested value from data object
  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Set nested value in data object
  const setNestedValue = (path: string, value: any) => {
    onChange(path, value);
  };

  // Infer field type from schema
  const inferFieldType = (fieldSchema: SchemaField): string => {
    if (fieldSchema.enum) return "dropdown";
    if (fieldSchema.type === "boolean") return "checkbox";
    if (fieldSchema.type === "number" || fieldSchema.type === "integer") return "number";
    if (fieldSchema.format === "date") return "date";
    if (fieldSchema.format === "date-time") return "datetime";
    if (fieldSchema.type === "string" && fieldSchema.maxLength && fieldSchema.maxLength > 100) return "textarea";
    return "text";
  };

  // Render a single field
  const renderField = (fieldName: string, fieldSchema: SchemaField, fieldPath: string, isRequired: boolean) => {
    const value = getNestedValue(data, fieldPath);
    const fieldType = inferFieldType(fieldSchema);
    const isDisabled = readOnly;

    // Generate label from field name
    const label = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    switch (fieldType) {
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setNestedValue(fieldPath, e.target.checked)}
              disabled={isDisabled}
              className="rounded border-border"
            />
            <span className="text-xs text-ink-muted">{label}</span>
            {isRequired && <span className="text-red-600">*</span>}
          </div>
        );

      case "dropdown":
        return (
          <div>
            <label className="text-xs text-ink-muted block mb-1">
              {label}
              {isRequired && <span className="text-red-600 ml-1">*</span>}
            </label>
            <select
              value={value || ""}
              onChange={(e) => setNestedValue(fieldPath, e.target.value)}
              disabled={isDisabled}
              className="w-full text-xs border border-border rounded px-2 py-1"
            >
              <option value="">Select...</option>
              {fieldSchema.enum?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case "number":
        return (
          <div>
            <label className="text-xs text-ink-muted block mb-1">
              {label}
              {isRequired && <span className="text-red-600 ml-1">*</span>}
            </label>
            <Input
              type="number"
              value={value || 0}
              onChange={(e) => setNestedValue(fieldPath, parseFloat(e.target.value) || 0)}
              disabled={isDisabled}
              className="text-xs"
              min={fieldSchema.minimum}
              max={fieldSchema.maximum}
            />
          </div>
        );

      case "date":
        return (
          <div>
            <label className="text-xs text-ink-muted block mb-1">
              {label}
              {isRequired && <span className="text-red-600 ml-1">*</span>}
            </label>
            <Input
              type="date"
              value={value || ""}
              onChange={(e) => setNestedValue(fieldPath, e.target.value)}
              disabled={isDisabled}
              className="text-xs"
            />
          </div>
        );

      case "datetime":
        return (
          <div>
            <label className="text-xs text-ink-muted block mb-1">
              {label}
              {isRequired && <span className="text-red-600 ml-1">*</span>}
            </label>
            <Input
              type="datetime-local"
              value={value || ""}
              onChange={(e) => setNestedValue(fieldPath, e.target.value)}
              disabled={isDisabled}
              className="text-xs"
            />
          </div>
        );

      case "textarea":
        return (
          <div>
            <label className="text-xs text-ink-muted block mb-1">
              {label}
              {isRequired && <span className="text-red-600 ml-1">*</span>}
            </label>
            <textarea
              value={value || ""}
              onChange={(e) => setNestedValue(fieldPath, e.target.value)}
              disabled={isDisabled}
              className="w-full text-xs border border-border rounded px-2 py-1"
              rows={3}
              maxLength={fieldSchema.maxLength}
            />
          </div>
        );

      default:
        return (
          <div>
            <label className="text-xs text-ink-muted block mb-1">
              {label}
              {isRequired && <span className="text-red-600 ml-1">*</span>}
            </label>
            <Input
              type="text"
              value={value || ""}
              onChange={(e) => setNestedValue(fieldPath, e.target.value)}
              disabled={isDisabled}
              className="text-xs"
              maxLength={fieldSchema.maxLength}
            />
            {fieldSchema.description && (
              <p className="text-[10px] text-ink-muted mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );
    }
  };

  // Render nested object
  const renderObject = (
    objSchema: any,
    path: string,
    name: string,
    depth: number = 0
  ): React.ReactNode => {
    if (depth > maxDepth) return null;
    if (!objSchema.properties) return null;

    const required = objSchema.required || [];
    const isExpanded = expandedSections.has(path);

    return (
      <div key={path} className="border border-border rounded-lg p-3 mb-3">
        {/* Section header with expand/collapse */}
        <button
          onClick={() => toggleSection(path)}
          className="flex items-center gap-2 w-full text-left mb-2"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-ink-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          )}
          <h4 className="text-sm font-semibold text-ink">
            {name.replace(/([A-Z])/g, " $1").trim()}
          </h4>
        </button>

        {/* Section content */}
        {isExpanded && (() => {
          // Separate fields into primitives and complex types
          const primitiveFields: Array<[string, any]> = [];
          const complexFields: Array<[string, any]> = [];

          Object.entries(objSchema.properties).forEach(([fieldName, fieldSchema]: [string, any]) => {
            const isObject = fieldSchema.properties && Object.keys(fieldSchema.properties).length > 0;
            const isArray = fieldSchema.type === "array";

            if (isObject || isArray) {
              complexFields.push([fieldName, fieldSchema]);
            } else {
              primitiveFields.push([fieldName, fieldSchema]);
            }
          });

          return (
            <div className="space-y-6 pl-6">
              {/* Primitives in 2-column grid */}
              {primitiveFields.length > 0 && (
                <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                  {primitiveFields.map(([fieldName, fieldSchema]) => {
                    const fieldPath = path ? `${path}.${fieldName}` : fieldName;
                    const isRequired = required.includes(fieldName);
                    return (
                      <div key={fieldPath}>
                        {renderField(fieldName, fieldSchema, fieldPath, isRequired)}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Complex fields (objects/arrays) stacked vertically */}
              {complexFields.length > 0 && (
                <div className="space-y-5">
                  {complexFields.map(([fieldName, fieldSchema]) => {
                    const fieldPath = path ? `${path}.${fieldName}` : fieldName;

                    // Handle nested objects
                    if (fieldSchema.properties && Object.keys(fieldSchema.properties).length > 0) {
                      return (
                        <React.Fragment key={fieldPath}>
                          {renderObject(fieldSchema, fieldPath, fieldName, depth + 1)}
                        </React.Fragment>
                      );
                    }

                    // Handle arrays
                    if (fieldSchema.type === "array") {
                      return (
                        <div key={fieldPath} className="p-2 bg-surface-muted rounded">
                          <p className="text-xs text-ink-muted">
                            Array field: {fieldName} (configure via UI Config Editor)
                          </p>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  // Unwrap root transaction wrapper if exists
  const getEffectiveSchema = () => {
    if (schema.properties) {
      const rootKeys = Object.keys(schema.properties);
      
      // Check for ImportDeclaration or ExportDeclaration wrapper
      if (rootKeys.length === 1 && 
          (rootKeys[0] === "ImportDeclaration" || rootKeys[0] === "ExportDeclaration")) {
        return schema.properties[rootKeys[0]];
      }
    }
    
    return schema;
  };

  const effectiveSchema = getEffectiveSchema();

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Default Schema View:</strong> No UI configuration found for this message. 
          Showing auto-generated form from schema. Configure fields in the Filing Configuration section for a customized layout.
        </p>
      </div>

      {/* Render schema fields */}
      {effectiveSchema.properties && (
        <div>
          {Object.entries(effectiveSchema.properties).map(([sectionName, sectionSchema]: [string, any]) => {
            if (sectionSchema.properties && Object.keys(sectionSchema.properties).length > 0) {
              return renderObject(sectionSchema, sectionName, sectionName, 0);
            }
            return null;
          })}
        </div>
      )}

      {/* Save button */}
      {onSave && !readOnly && (
        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={onSave} size="sm">
            Save Declaration
          </Button>
        </div>
      )}
    </div>
  );
}
