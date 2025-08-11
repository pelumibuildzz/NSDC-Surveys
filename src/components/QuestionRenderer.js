"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAsterisk, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function QuestionRenderer({ question, value, onChange, error }) {
  const handleInputChange = (newValue) => {
    onChange(question.id, newValue);
  };

  const renderByType = () => {
    switch (question.type) {
      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={question.placeholder}
            className={`form-input ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : ""
            }`}
          />
        );

      case "number":
        return (
          <div className="relative">
            <input
              type="number"
              value={value || ""}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={question.placeholder}
              min={question.min}
              max={question.max}
              step={question.step || "any"}
              className={`form-input ${question.unit ? "pr-12" : ""} ${
                error
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
            />
            {question.unit && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-[17px]">
                {question.unit}
              </span>
            )}
          </div>
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={question.placeholder}
            rows={question.rows || 4}
            className={`form-input resize-none ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : ""
            }`}
          />
        );

      case "radio":
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.value} className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={
                      typeof value === "object"
                        ? value?.value === option.value
                        : value === option.value
                    }
                    onChange={(e) => {
                      if (option.hasTextField) {
                        handleInputChange({
                          value: e.target.value,
                          textField: "",
                        });
                      } else {
                        handleInputChange(e.target.value);
                      }
                    }}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
                {option.hasTextField &&
                  (typeof value === "object"
                    ? value?.value === option.value
                    : value === option.value) && (
                    <div className="ml-6">
                      <input
                        type="text"
                        value={
                          typeof value === "object"
                            ? value?.textField || ""
                            : ""
                        }
                        onChange={(e) =>
                          handleInputChange({
                            value: option.value,
                            textField: e.target.value,
                          })
                        }
                        placeholder={option.textFieldPlaceholder}
                        className="form-input"
                      />
                    </div>
                  )}
              </div>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.value} className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={
                      Array.isArray(value) &&
                      value.some((v) =>
                        typeof v === "string"
                          ? v === option.value
                          : v?.value === option.value
                      )
                    }
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        if (option.hasTextField) {
                          handleInputChange([
                            ...currentValues,
                            { value: option.value, textField: "" },
                          ]);
                        } else {
                          handleInputChange([...currentValues, option.value]);
                        }
                      } else {
                        handleInputChange(
                          currentValues.filter((v) =>
                            typeof v === "string"
                              ? v !== option.value
                              : v?.value !== option.value
                          )
                        );
                      }
                    }}
                    className="mt-1 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
                {option.hasTextField &&
                  Array.isArray(value) &&
                  value.some(
                    (v) => typeof v === "object" && v?.value === option.value
                  ) && (
                    <div className="ml-6">
                      <input
                        type="text"
                        value={
                          Array.isArray(value)
                            ? value.find(
                                (v) =>
                                  typeof v === "object" &&
                                  v?.value === option.value
                              )?.textField || ""
                            : ""
                        }
                        onChange={(e) => {
                          const currentValues = Array.isArray(value)
                            ? [...value]
                            : [];
                          const index = currentValues.findIndex(
                            (v) =>
                              typeof v === "object" && v?.value === option.value
                          );
                          if (index !== -1) {
                            currentValues[index] = {
                              value: option.value,
                              textField: e.target.value,
                            };
                            handleInputChange(currentValues);
                          }
                        }}
                        placeholder={option.textFieldPlaceholder}
                        className="form-input"
                      />
                    </div>
                  )}
              </div>
            ))}
          </div>
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`form-input ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : ""
            }`}
          >
            <option value="">Select an option...</option>
            {question.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  {question.columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-[17px] font-medium text-gray-700 border-b"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b">
                    {question.columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {column.readonly || row[column.key] ? (
                          <span className="font-medium text-gray-900">
                            {row[column.key]}
                          </span>
                        ) : (
                          <input
                            type={column.type || "text"}
                            value={value?.[rowIndex]?.[column.key] || ""}
                            onChange={(e) => {
                              const newValue = Array.isArray(value)
                                ? [...value]
                                : [];
                              if (!newValue[rowIndex]) newValue[rowIndex] = {};
                              newValue[rowIndex][column.key] = e.target.value;
                              handleInputChange(newValue);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={column.placeholder}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "repeatable":
        const items = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-4">
            {question.description && (
              <p className="text-[17px] text-gray-600">
                {question.description}
              </p>
            )}
            {items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">
                    Item {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = items.filter((_, i) => i !== index);
                      handleInputChange(newItems);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div className="grid gap-4">
                  {question.fields.map((field) => (
                    <div key={field.key}>
                      <label className="form-label">
                        {field.label}
                        {field.required && (
                          <FontAwesomeIcon
                            icon={faAsterisk}
                            className="text-red-500 text-xs ml-1"
                          />
                        )}
                      </label>
                      <input
                        type={field.type || "text"}
                        value={item[field.key] || ""}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = {
                            ...newItems[index],
                            [field.key]: e.target.value,
                          };
                          handleInputChange(newItems);
                        }}
                        placeholder={field.placeholder}
                        className="form-input"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {items.length < (question.maxItems || 10) && (
              <button
                type="button"
                onClick={() => {
                  const newItem = {};
                  question.fields.forEach((field) => {
                    newItem[field.key] = "";
                  });
                  handleInputChange([...items, newItem]);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Item
              </button>
            )}
          </div>
        );

      case "percentage":
        const percentageValues = value || {};
        const total = Object.values(percentageValues).reduce(
          (sum, val) => sum + (parseFloat(val) || 0),
          0
        );

        return (
          <div className="space-y-4">
            {question.description && (
              <p className="text-[17px] text-gray-600">
                {question.description}
              </p>
            )}
            {question.fields.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <label className="flex-1 text-[17px] font-medium text-gray-700">
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={percentageValues[field.key] || ""}
                    onChange={(e) =>
                      handleInputChange({
                        ...percentageValues,
                        [field.key]: e.target.value,
                      })
                    }
                    placeholder={field.placeholder}
                    min="0"
                    max="100"
                    className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            ))}
            <div
              className={`text-[20px] font-medium ${
                total === 100
                  ? "text-green-600"
                  : total > 100
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              Total: {total.toFixed(1)}%
              {total !== 100 && (
                <span className="text-gray-500"> (should equal 100%)</span>
              )}
            </div>
          </div>
        );

      case "group":
        return (
          <div className="space-y-4">
            {question.description && (
              <p className="text-[17px] text-gray-600">
                {question.description}
              </p>
            )}
            <div className="grid gap-4">
              {question.fields.map((field) => (
                <div key={field.key}>
                  <label className="form-label">
                    {field.label}
                    {field.required && (
                      <FontAwesomeIcon
                        icon={faAsterisk}
                        className="text-red-500 text-xs ml-1"
                      />
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={field.type || "text"}
                      value={value?.[field.key] || ""}
                      onChange={(e) =>
                        handleInputChange({
                          ...value,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className={`form-input ${field.unit ? "pr-12" : ""}`}
                    />
                    {field.unit && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-[17px]">
                        {field.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "rating-table":
        return (
          <div className="space-y-6">
            {question.description && (
              <p className="text-[17px] text-gray-600 mb-4">
                {question.description}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-[17px] font-medium text-gray-700 border-b">
                      Factor
                    </th>
                    {Array.from(
                      { length: question.scale.max },
                      (_, i) => i + 1
                    ).map((rating) => (
                      <th
                        key={rating}
                        className="px-3 py-3 text-center text-[17px] font-medium text-gray-700 border-b"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{rating}</span>
                          <span className="text-xs text-gray-500">
                            {question.scale.labels[rating]}
                          </span>
                        </div>
                      </th>
                    ))}
                    {question.scale.includeNA && (
                      <th className="px-3 py-3 text-center text-[17px] font-medium text-gray-700 border-b">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">N/A</span>
                          <span className="text-xs text-gray-500">
                            Not Applicable
                          </span>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {question.categories.map((category, categoryIndex) => (
                    <React.Fragment key={category.name}>
                      <tr>
                        <td
                          colSpan="100%"
                          className="px-4 py-2 bg-blue-50 font-semibold text-blue-900 text-[17px] border-b"
                        >
                          {category.name}
                        </td>
                      </tr>
                      {category.factors.map((factor) => (
                        <tr
                          key={factor.key}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-[17px] text-gray-900">
                            {factor.label}
                          </td>
                          {Array.from(
                            { length: question.scale.max },
                            (_, i) => i + 1
                          ).map((rating) => (
                            <td key={rating} className="px-3 py-3 text-center">
                              <input
                                type="radio"
                                name={`${question.id}_${factor.key}`}
                                value={rating}
                                checked={value?.[factor.key] === rating}
                                onChange={(e) =>
                                  handleInputChange({
                                    ...value,
                                    [factor.key]: parseInt(e.target.value),
                                  })
                                }
                                className="text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                          {question.scale.includeNA && (
                            <td className="px-3 py-3 text-center">
                              <input
                                type="radio"
                                name={`${question.id}_${factor.key}`}
                                value="N/A"
                                checked={value?.[factor.key] === "N/A"}
                                onChange={(e) =>
                                  handleInputChange({
                                    ...value,
                                    [factor.key]: e.target.value,
                                  })
                                }
                                className="text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="space-y-4">
            {question.items.map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label
                      key={rating}
                      className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`${question.id}_${item.key}`}
                        value={rating}
                        checked={value?.[item.key] === rating}
                        onChange={(e) =>
                          handleInputChange({
                            ...value,
                            [item.key]: parseInt(e.target.value),
                          })
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[17px] text-gray-600">
                        {rating}
                      </span>
                    </label>
                  ))}
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`${question.id}_${item.key}`}
                      value="N/A"
                      checked={value?.[item.key] === "N/A"}
                      onChange={(e) =>
                        handleInputChange({
                          ...value,
                          [item.key]: e.target.value,
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[17px] text-gray-600">N/A</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-gray-500 italic">
            Question type "{question.type}" not supported
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <label className="form-label">
        {question.label}
        {question.required && (
          <FontAwesomeIcon
            icon={faAsterisk}
            className="text-red-500 text-xs ml-1"
          />
        )}
      </label>

      {question.note && (
        <p className="text-[17px] text-gray-600 -mt-2">{question.note}</p>
      )}

      {renderByType()}

      {error && <p className="text-[17px] text-red-600">{error}</p>}
    </div>
  );
}
