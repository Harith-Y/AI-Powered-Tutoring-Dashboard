import React, { useState } from 'react';
import { X, Clock, Save } from 'lucide-react';

interface AvailabilitySetupProps {
  availability: { [key: string]: number };
  onUpdate: (availability: { [key: string]: number }) => void;
  onClose: () => void;
}

const AvailabilitySetup: React.FC<AvailabilitySetupProps> = ({
  availability,
  onUpdate,
  onClose
}) => {
  const [localAvailability, setLocalAvailability] = useState(availability);

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayChange = (day: string, hours: number) => {
    setLocalAvailability(prev => ({
      ...prev,
      [day]: Math.max(0, Math.min(12, hours)) // Limit between 0-12 hours
    }));
  };

  const handleSave = () => {
    onUpdate(localAvailability);
    onClose();
  };

  const presetSchedules = [
    {
      name: 'Weekdays Only',
      schedule: {
        monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2,
        saturday: 0, sunday: 0
      }
    },
    {
      name: 'Balanced',
      schedule: {
        monday: 1.5, tuesday: 1.5, wednesday: 1.5, thursday: 1.5, friday: 1.5,
        saturday: 2, sunday: 2
      }
    },
    {
      name: 'Weekend Intensive',
      schedule: {
        monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1,
        saturday: 4, sunday: 4
      }
    },
    {
      name: 'Daily Consistent',
      schedule: {
        monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1,
        saturday: 1, sunday: 1
      }
    }
  ];

  const totalHours = Object.values(localAvailability).reduce((sum, hours) => sum + hours, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-indigo-600" />
            Set Your Weekly Availability
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Tell us how many hours you can dedicate to learning each day. This helps our AI create a realistic study plan.
          </p>

          {/* Preset Schedules */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presetSchedules.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setLocalAvailability(preset.schedule)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{preset.name}</div>
                  <div className="text-sm text-gray-600">
                    {Object.values(preset.schedule).reduce((sum, h) => sum + h, 0)}h/week total
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Schedule */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Schedule</h3>
            <div className="space-y-4">
              {weekDays.map((day, index) => (
                <div key={day} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium text-gray-700">
                      {weekDayLabels[index]}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDayChange(day, localAvailability[day] - 0.5)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        -
                      </button>
                      <div className="w-16 text-center">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={localAvailability[day] || 0}
                          onChange={(e) => handleDayChange(day, parseFloat(e.target.value) || 0)}
                          className="w-full text-center border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleDayChange(day, localAvailability[day] + 0.5)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {localAvailability[day] > 0 ? `${localAvailability[day]}h` : 'Rest day'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-indigo-800">Total Weekly Commitment</div>
                <div className="text-2xl font-bold text-indigo-600">{totalHours}h</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-indigo-700">
                  Average: {(totalHours / 7).toFixed(1)}h/day
                </div>
                <div className="text-xs text-indigo-600">
                  {totalHours < 5 ? 'Light schedule' : 
                   totalHours < 15 ? 'Moderate schedule' : 
                   'Intensive schedule'}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-800 mb-2">💡 Recommendations</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Aim for at least 5-7 hours per week for meaningful progress</li>
              <li>• Consistency is better than intensity - daily practice helps retention</li>
              <li>• Include rest days to avoid burnout and consolidate learning</li>
              <li>• Consider your energy levels - schedule harder topics when you're most alert</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Availability
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySetup;