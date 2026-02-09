import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    customForm: {
      fields: [],
    },
    merchandiseDetails: {
      itemName: '',
      variants: [],
      purchaseLimit: 1,
    },
  });

  const [currentField, setCurrentField] = useState({
    fieldId: '',
    fieldType: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
  });

  const [currentVariant, setCurrentVariant] = useState({
    name: '',
    size: '',
    color: '',
    stock: 0,
    price: 0,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAddField = () => {
    if (!currentField.label) {
      alert('Field label is required');
      return;
    }

    const newField = {
      ...currentField,
      fieldId: `field_${Date.now()}`,
      order: formData.customForm.fields.length,
    };

    setFormData({
      ...formData,
      customForm: {
        ...formData.customForm,
        fields: [...formData.customForm.fields, newField],
      },
    });

    setCurrentField({
      fieldId: '',
      fieldType: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
    });
  };

  const handleRemoveField = (index) => {
    const newFields = formData.customForm.fields.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      customForm: {
        ...formData.customForm,
        fields: newFields,
      },
    });
  };

  const handleAddVariant = () => {
    if (!currentVariant.name || currentVariant.stock <= 0 || currentVariant.price <= 0) {
      alert('Please fill all variant details');
      return;
    }

    setFormData({
      ...formData,
      merchandiseDetails: {
        ...formData.merchandiseDetails,
        variants: [...formData.merchandiseDetails.variants, currentVariant],
      },
    });

    setCurrentVariant({
      name: '',
      size: '',
      color: '',
      stock: 0,
      price: 0,
    });
  };

  const handleRemoveVariant = (index) => {
    const newVariants = formData.merchandiseDetails.variants.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      merchandiseDetails: {
        ...formData.merchandiseDetails,
        variants: newVariants,
      },
    });
  };

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.description) {
      alert('Name and description are required');
      return;
    }

    if (formData.eventType === 'merchandise' && formData.merchandiseDetails.variants.length === 0) {
      alert('Please add at least one merchandise variant');
      return;
    }

    try {
      setLoading(true);

      const eventData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : null,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        status: publish ? 'published' : 'draft',
      };

      // Remove empty customForm if normal event
      if (formData.eventType === 'normal' && formData.customForm.fields.length === 0) {
        delete eventData.customForm;
      }

      // Remove merchandiseDetails if not merchandise event
      if (formData.eventType !== 'merchandise') {
        delete eventData.merchandiseDetails;
      }

      const response = await eventAPI.create(eventData);
      
      if (publish) {
        // If publishing, update status
        await eventAPI.update(response.data.event._id, { status: 'published' });
      }

      alert(`Event ${publish ? 'published' : 'saved as draft'} successfully!`);
      navigate('/organizer/dashboard');
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Event</h1>

          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input"
                    rows={4}
                    required
                  />
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
                      <option value="merchandise">Merchandise</option>
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
                      <option value="all">All</option>
                      <option value="iiit-only">IIIT Only</option>
                      <option value="non-iiit-only">Non-IIIT Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dates & Limits</h2>

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
                    className="input"
                    required
                  />
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
                    className="input"
                    required
                  />
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
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="input"
                  placeholder="technical, workshop, coding"
                />
              </div>
            </div>

            {/* Custom Form Builder (Normal Events) */}
            {formData.eventType === 'normal' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Custom Registration Form
                </h2>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Type
                      </label>
                      <select
                        value={currentField.fieldType}
                        onChange={(e) =>
                          setCurrentField({ ...currentField, fieldType: e.target.value })
                        }
                        className="input"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                        <option value="file">File Upload</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Label
                      </label>
                      <input
                        type="text"
                        value={currentField.label}
                        onChange={(e) =>
                          setCurrentField({ ...currentField, label: e.target.value })
                        }
                        className="input"
                        placeholder="e.g., Phone Number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placeholder (Optional)
                      </label>
                      <input
                        type="text"
                        value={currentField.placeholder}
                        onChange={(e) =>
                          setCurrentField({ ...currentField, placeholder: e.target.value })
                        }
                        className="input"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentField.required}
                        onChange={(e) =>
                          setCurrentField({ ...currentField, required: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700">Required Field</label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddField}
                    className="btn-primary mt-4 flex items-center"
                  >
                    <FiPlus className="mr-2" />
                    Add Field
                  </button>
                </div>

                {/* Display Added Fields */}
                {formData.customForm.fields.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Added Fields:</h3>
                    {formData.customForm.fields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded border"
                      >
                        <div>
                          <span className="font-medium">{field.label}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({field.fieldType})
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-600 ml-2">*Required</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Merchandise Details */}
            {formData.eventType === 'merchandise' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Merchandise Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.merchandiseDetails.itemName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        merchandiseDetails: {
                          ...formData.merchandiseDetails,
                          itemName: e.target.value,
                        },
                      })
                    }
                    className="input"
                    placeholder="e.g., Fest T-Shirt"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Limit Per Person
                  </label>
                  <input
                    type="number"
                    value={formData.merchandiseDetails.purchaseLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        merchandiseDetails: {
                          ...formData.merchandiseDetails,
                          purchaseLimit: parseInt(e.target.value),
                        },
                      })
                    }
                    className="input"
                    min="1"
                  />
                </div>

                {/* Add Variant */}
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Add Variant</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Name *
                      </label>
                      <input
                        type="text"
                        value={currentVariant.name}
                        onChange={(e) =>
                          setCurrentVariant({ ...currentVariant, name: e.target.value })
                        }
                        className="input"
                        placeholder="e.g., Large - Black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <input
                        type="text"
                        value={currentVariant.size}
                        onChange={(e) =>
                          setCurrentVariant({ ...currentVariant, size: e.target.value })
                        }
                        className="input"
                        placeholder="S, M, L, XL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        value={currentVariant.color}
                        onChange={(e) =>
                          setCurrentVariant({ ...currentVariant, color: e.target.value })
                        }
                        className="input"
                        placeholder="Black, White, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock *
                      </label>
                      <input
                        type="number"
                        value={currentVariant.stock}
                        onChange={(e) =>
                          setCurrentVariant({
                            ...currentVariant,
                            stock: parseInt(e.target.value),
                          })
                        }
                        className="input"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={currentVariant.price}
                        onChange={(e) =>
                          setCurrentVariant({
                            ...currentVariant,
                            price: parseFloat(e.target.value),
                          })
                        }
                        className="input"
                        min="0"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="btn-primary mt-4 flex items-center"
                  >
                    <FiPlus className="mr-2" />
                    Add Variant
                  </button>
                </div>

                {/* Display Variants */}
                {formData.merchandiseDetails.variants.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium text-gray-900">Added Variants:</h3>
                    {formData.merchandiseDetails.variants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded border"
                      >
                        <div>
                          <span className="font-medium">{variant.name}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            Stock: {variant.stock} | Price: ₹{variant.price}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
                className="btn-secondary flex-1 flex items-center justify-center"
              >
                <FiSave className="mr-2" />
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                <FiSave className="mr-2" />
                {loading ? 'Publishing...' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;