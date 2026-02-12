import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import { FiPlus, FiTrash2, FiSave, FiSend } from 'react-icons/fi';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'normal',
    eligibility: 'all',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    registrationLimit: '',
    registrationFee: 0,
    tags: '',
  });

  // Custom form fields (for normal events)
  const [customFields, setCustomFields] = useState([]);

  // Merchandise items (for merchandise events) - UPDATED
  const [merchandiseItems, setMerchandiseItems] = useState([
    {
      itemId: 'item-1',
      itemName: '',
      description: '',
      purchaseLimit: 1,
      variants: [
        {
          variantId: 'var-1',
          name: '',
          size: '',
          color: '',
          stock: 0,
          price: 0,
        },
      ],
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Add new merchandise item
  const handleAddMerchandiseItem = () => {
    const newItem = {
      itemId: `item-${Date.now()}`,
      itemName: '',
      description: '',
      purchaseLimit: 1,
      variants: [
        {
          variantId: `var-${Date.now()}`,
          name: '',
          size: '',
          color: '',
          stock: 0,
          price: 0,
        },
      ],
    };
    setMerchandiseItems([...merchandiseItems, newItem]);
  };

  // Remove merchandise item
  const handleRemoveMerchandiseItem = (itemIndex) => {
    if (merchandiseItems.length === 1) {
      alert('At least one merchandise item is required');
      return;
    }
    setMerchandiseItems(merchandiseItems.filter((_, i) => i !== itemIndex));
  };

  // Update merchandise item field
  const handleMerchandiseItemChange = (itemIndex, field, value) => {
    const updated = merchandiseItems.map((item, i) => {
      if (i === itemIndex) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setMerchandiseItems(updated);
  };

  // Add variant to a specific merchandise item
  const handleAddVariant = (itemIndex) => {
    const updated = merchandiseItems.map((item, i) => {
      if (i === itemIndex) {
        return {
          ...item,
          variants: [
            ...item.variants,
            {
              variantId: `var-${Date.now()}`,
              name: '',
              size: '',
              color: '',
              stock: 0,
              price: 0,
            },
          ],
        };
      }
      return item;
    });
    setMerchandiseItems(updated);
  };

  // Remove variant from a specific merchandise item
  const handleRemoveVariant = (itemIndex, variantIndex) => {
    const updated = merchandiseItems.map((item, i) => {
      if (i === itemIndex) {
        if (item.variants.length === 1) {
          alert('At least one variant is required per item');
          return item;
        }
        return {
          ...item,
          variants: item.variants.filter((_, vi) => vi !== variantIndex),
        };
      }
      return item;
    });
    setMerchandiseItems(updated);
  };

  // Update variant field
  const handleVariantChange = (itemIndex, variantIndex, field, value) => {
    const updated = merchandiseItems.map((item, i) => {
      if (i === itemIndex) {
        return {
          ...item,
          variants: item.variants.map((variant, vi) => {
            if (vi === variantIndex) {
              return { ...variant, [field]: value };
            }
            return variant;
          }),
        };
      }
      return item;
    });
    setMerchandiseItems(updated);
  };

  // Add custom field (for normal events)
  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        fieldId: `field-${Date.now()}`,
        fieldType: 'text',
        label: '',
        placeholder: '',
        required: false,
        options: [],
      },
    ]);
  };

  // Remove custom field
  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Update custom field
  const handleCustomFieldChange = (index, field, value) => {
    const updated = customFields.map((f, i) => {
      if (i === index) {
        return { ...f, [field]: value };
      }
      return f;
    });
    setCustomFields(updated);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Event name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.registrationDeadline) newErrors.registrationDeadline = 'Registration deadline is required';
    if (!formData.eventStartDate) newErrors.eventStartDate = 'Start date is required';
    if (!formData.eventEndDate) newErrors.eventEndDate = 'End date is required';

    // Validate merchandise if merchandise event
    if (formData.eventType === 'merchandise') {
      merchandiseItems.forEach((item, itemIndex) => {
        if (!item.itemName.trim()) {
          newErrors[`merchandise-${itemIndex}`] = 'Item name is required';
        }
        item.variants.forEach((variant, variantIndex) => {
          if (!variant.name.trim()) {
            newErrors[`variant-${itemIndex}-${variantIndex}`] = 'Variant name is required';
          }
          if (variant.price <= 0) {
            newErrors[`variant-price-${itemIndex}-${variantIndex}`] = 'Price must be greater than 0';
          }
        });
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status) => {
    if (!validate()) {
      alert('Please fill in all required fields');
      return;
    }

    const eventData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      status,
    };

    if (formData.eventType === 'merchandise') {
      eventData.merchandiseItems = merchandiseItems;
    }
    // Always include custom form fields regardless of event type
    if (customFields.length > 0) {
      // send in backend schema: customForm.fields
      eventData.customForm = { fields: customFields };
    }

    try {
      setLoading(true);
      await eventAPI.create(eventData);

      alert(`Event ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`);
      navigate('/organizer/dashboard');
    } catch (error) {
      alert('Failed to create event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Event</h1>

          {/* Basic Information */}
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., Tech Fest 2024"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`input ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe your event..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="normal">Normal Event</option>
                  <option value="merchandise">Merchandise Sale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eligibility *
                </label>
                <select
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="all">All Participants</option>
                  <option value="iiit-only">IIIT Only</option>
                  <option value="non-iiit-only">Non-IIIT Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className={`input ${errors.registrationDeadline ? 'border-red-500' : ''}`}
                />
                {errors.registrationDeadline && <p className="text-red-500 text-xs mt-1">{errors.registrationDeadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Start Date *
                </label>
                <input
                  type="datetime-local"
                  name="eventStartDate"
                  value={formData.eventStartDate}
                  onChange={handleChange}
                  className={`input ${errors.eventStartDate ? 'border-red-500' : ''}`}
                />
                {errors.eventStartDate && <p className="text-red-500 text-xs mt-1">{errors.eventStartDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event End Date *
                </label>
                <input
                  type="datetime-local"
                  name="eventEndDate"
                  value={formData.eventEndDate}
                  onChange={handleChange}
                  className={`input ${errors.eventEndDate ? 'border-red-500' : ''}`}
                />
                {errors.eventEndDate && <p className="text-red-500 text-xs mt-1">{errors.eventEndDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Limit (Optional)
                </label>
                <input
                  type="number"
                  name="registrationLimit"
                  value={formData.registrationLimit}
                  onChange={handleChange}
                  className="input"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {formData.eventType === 'normal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Fee (₹)
                  </label>
                  <input
                    type="number"
                    name="registrationFee"
                    value={formData.registrationFee}
                    onChange={handleChange}
                    className="input"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input"
                placeholder="e.g., workshop, coding, hackathon"
              />
            </div>
          </div>

          {/* Merchandise Section - UPDATED */}
          {formData.eventType === 'merchandise' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Merchandise Items</h2>
                <button
                  type="button"
                  onClick={handleAddMerchandiseItem}
                  className="btn-secondary flex items-center text-sm"
                >
                  <FiPlus className="mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-6">
                {merchandiseItems.map((item, itemIndex) => (
                  <div
                    key={item.itemId}
                    className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Item #{itemIndex + 1}
                      </h3>
                      {merchandiseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMerchandiseItem(itemIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleMerchandiseItemChange(itemIndex, 'itemName', e.target.value)}
                          className={`input ${errors[`merchandise-${itemIndex}`] ? 'border-red-500' : ''}`}
                          placeholder="e.g., Fest T-Shirt, Keychain, Water Bottle"
                        />
                        {errors[`merchandise-${itemIndex}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`merchandise-${itemIndex}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => handleMerchandiseItemChange(itemIndex, 'description', e.target.value)}
                          className="input"
                          rows={2}
                          placeholder="Describe this merchandise item..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Purchase Limit Per Person
                        </label>
                        <input
                          type="number"
                          value={item.purchaseLimit}
                          onChange={(e) => handleMerchandiseItemChange(itemIndex, 'purchaseLimit', parseInt(e.target.value) || 1)}
                          className="input"
                          min="1"
                        />
                      </div>

                      {/* Variants for this item */}
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Variants</h4>
                          <button
                            type="button"
                            onClick={() => handleAddVariant(itemIndex)}
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                          >
                            <FiPlus className="mr-1" />
                            Add Variant
                          </button>
                        </div>

                        <div className="space-y-3">
                          {item.variants.map((variant, variantIndex) => (
                            <div
                              key={variant.variantId}
                              className="p-3 bg-white border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Variant #{variantIndex + 1}
                                </span>
                                {item.variants.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(itemIndex, variantIndex)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <FiTrash2 size={16} />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Variant Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => handleVariantChange(itemIndex, variantIndex, 'name', e.target.value)}
                                    className={`input text-sm ${errors[`variant-${itemIndex}-${variantIndex}`] ? 'border-red-500' : ''}`}
                                    placeholder="e.g., Large - Black"
                                  />
                                  {errors[`variant-${itemIndex}-${variantIndex}`] && (
                                    <p className="text-red-500 text-xs mt-1">{errors[`variant-${itemIndex}-${variantIndex}`]}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Size
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.size}
                                    onChange={(e) => handleVariantChange(itemIndex, variantIndex, 'size', e.target.value)}
                                    className="input text-sm"
                                    placeholder="S, M, L, XL"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Color
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.color}
                                    onChange={(e) => handleVariantChange(itemIndex, variantIndex, 'color', e.target.value)}
                                    className="input text-sm"
                                    placeholder="Black, White, etc."
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Stock *
                                  </label>
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) => handleVariantChange(itemIndex, variantIndex, 'stock', parseInt(e.target.value) || 0)}
                                    className="input text-sm"
                                    min="0"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Price (₹) *
                                  </label>
                                  <input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) => handleVariantChange(itemIndex, variantIndex, 'price', parseFloat(e.target.value) || 0)}
                                    className={`input text-sm ${errors[`variant-price-${itemIndex}-${variantIndex}`] ? 'border-red-500' : ''}`}
                                    min="0"
                                    step="0.01"
                                  />
                                  {errors[`variant-price-${itemIndex}-${variantIndex}`] && (
                                    <p className="text-red-500 text-xs mt-1">{errors[`variant-price-${itemIndex}-${variantIndex}`]}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Form Section (for all event types) */}
          <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Custom Registration Form (Optional)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Collect additional info from participants at registration
                </p>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="btn-secondary flex items-center text-sm"
                >
                  <FiPlus className="mr-1" />
                  Add Field
                </button>
              </div>

              {customFields.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No custom fields added. Basic registration info will be collected automatically.
                </p>
              ) : (
                <div className="space-y-3">
                  {customFields.map((field, index) => (
                    <div key={field.fieldId} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Field #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Field Type
                          </label>
                          <select
                            value={field.fieldType}
                            onChange={(e) => handleCustomFieldChange(index, 'fieldType', e.target.value)}
                            className="input text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="number">Number</option>
                            <option value="textarea">Text Area</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="radio">Radio</option>
                            <option value="file">File Upload</option>
                            <option value="date">Date</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                            className="input text-sm"
                            placeholder="e.g., T-Shirt Size"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(e) => handleCustomFieldChange(index, 'placeholder', e.target.value)}
                            className="input text-sm"
                          />
                        </div>

                        <div className="flex items-center pt-5">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => handleCustomFieldChange(index, 'required', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-xs font-medium text-gray-700">Required Field</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
            >
              <FiSave className="mr-2" />
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSubmit('published')}
              disabled={loading}
              className="flex-1 btn-primary py-3 flex items-center justify-center disabled:opacity-50"
            >
              <FiSend className="mr-2" />
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;