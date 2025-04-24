'use client';

import React, { useState } from 'react';

// Types for form field structure
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'checkbox' | 'textarea' | 'select' | 'table';
  value: any;
  options?: { value: string; label: string }[]; // For select fields
  columns?: { id: string; label: string; type: string }[]; // For table fields
  rows?: any[]; // For table fields
  required?: boolean;
  validation?: RegExp;
  parent?: string; // For nested fields
  nested?: FormField[]; // For fields that have nested sub-fields
}

interface DynamicFormProps {
  documentType: string;
  formData: FormField[];
  onFieldChange: (fieldId: string, value: any) => void;
  onAddField: (parentId?: string) => void;
  onAddTableRow?: (tableId: string) => void;
  isReadOnly?: boolean;
}

export default function DynamicForm({
  documentType,
  formData,
  onFieldChange,
  onAddField,
  onAddTableRow,
  isReadOnly = false,
}: DynamicFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate field value based on type
  const validateField = (field: FormField, value: any): string => {
    if (field.required && (value === '' || value === null || value === undefined)) {
      return 'This field is required';
    }

    if (field.validation && typeof value === 'string' && !field.validation.test(value)) {
      return 'Invalid value format';
    }

    switch (field.type) {
      case 'number':
        if (isNaN(Number(value))) {
          return 'Must be a valid number';
        }
        break;
      case 'date':
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return 'Must be a valid date format (YYYY-MM-DD)';
        }
        break;
    }

    return '';
  };

  const handleChange = (field: FormField, value: any) => {
    const error = validateField(field, value);
    
    if (error) {
      setErrors(prev => ({ ...prev, [field.id]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.id];
        return newErrors;
      });
    }

    onFieldChange(field.id, value);
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isReadOnly}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={field.value || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isReadOnly}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={field.value || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isReadOnly}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={field.value || false}
            onChange={(e) => handleChange(field, e.target.checked)}
            disabled={isReadOnly}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={field.value || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isReadOnly}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        );

      case 'select':
        return (
          <select
            value={field.value || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isReadOnly}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {field.columns?.map((column) => (
                    <th 
                      key={column.id}
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {field.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {field.columns?.map((column) => (
                      <td key={column.id} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {renderTableCell(field.id, column, row, rowIndex)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!isReadOnly && onAddTableRow && (
              <button
                type="button"
                onClick={() => onAddTableRow(field.id)}
                className="mt-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + Add Row
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderTableCell = (tableId: string, column: any, row: any, rowIndex: number) => {
    const value = row[column.id];
    
    if (isReadOnly) {
      return value;
    }

    switch (column.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              const updatedRows = [...(formData.find(f => f.id === tableId)?.rows || [])];
              updatedRows[rowIndex] = { ...updatedRows[rowIndex], [column.id]: newValue };
              onFieldChange(`${tableId}.rows`, updatedRows);
            }}
            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              const updatedRows = [...(formData.find(f => f.id === tableId)?.rows || [])];
              updatedRows[rowIndex] = { ...updatedRows[rowIndex], [column.id]: newValue };
              onFieldChange(`${tableId}.rows`, updatedRows);
            }}
            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      
      default:
        return value;
    }
  };

  // Recursive function to render fields with proper nesting
  const renderFields = (fields: FormField[], parentId?: string) => {
    return fields
      .filter(field => field.parent === parentId)
      .map(field => (
        <div key={field.id} className="mb-4">
          <div className="flex items-start justify-between">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>

          {renderField(field)}
          
          {errors[field.id] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
          )}

          {/* Render nested fields if any */}
          {field.nested && field.nested.length > 0 && (
            <div className="ml-4 mt-2 pl-2 border-l-2 border-gray-200">
              {renderFields(field.nested, field.id)}
            </div>
          )}

          {/* Add field button for nested sections */}
          {!isReadOnly && field.type === 'nested' && (
            <button
              type="button"
              onClick={() => onAddField(field.id)}
              className="mt-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Add {field.label} Field
            </button>
          )}
        </div>
      ));
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {documentType.charAt(0).toUpperCase() + documentType.slice(1)} Data
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {isReadOnly ? 'Review extracted information' : 'Edit extracted information'}
        </p>
      </div>

      <div className="flex-grow p-4 overflow-auto">
        <form className="space-y-6">
          {renderFields(formData)}

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onAddField()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Add Field
            </button>
          )}
        </form>
      </div>
    </div>
  );
} 