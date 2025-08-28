"use client";

import { useState } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates?: string[];
  className?: string;
}

export default function DatePicker({ 
  selectedDate, 
  onDateChange, 
  availableDates = [], 
  className = "" 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  // Convert available dates to Date objects for comparison
  const availableDateObjects = availableDates.map(date => parseISO(date));

  const today = new Date();
  const selectedDateObj = parseISO(selectedDate);

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    onDateChange(dateString);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateAvailable = (date: Date) => {
    return availableDateObjects.some(availableDate => isSameDay(availableDate, date));
  };

  const isDateInPast = (date: Date) => {
    return date < today;
  };

  const isSelectedDate = (date: Date) => {
    return isSameDay(date, selectedDateObj);
  };

  const isToday = (date: Date) => {
    return isSameDay(date, today);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Date Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
      >
        <div className="flex items-center min-w-0 flex-1">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">{format(selectedDateObj, 'MMM dd, yyyy')}</span>
        </div>
        <ChevronLeftIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full sm:w-auto sm:min-w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200">
            <button
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 rounded touch-manipulation"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900 px-2">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded touch-manipulation"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-2 sm:p-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-8 sm:h-10" />;
                }

                const isAvailable = isDateAvailable(day);
                const isPast = isDateInPast(day);
                const isSelected = isSelectedDate(day);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => isAvailable && handleDateSelect(day)}
                    disabled={!isAvailable}
                    className={`
                      h-8 sm:h-10 w-full text-xs rounded-md transition-colors touch-manipulation
                      ${isSelected 
                        ? 'bg-blue-600 text-white font-semibold' 
                        : isTodayDate 
                        ? 'bg-blue-100 text-blue-700 font-semibold' 
                        : isAvailable 
                        ? 'hover:bg-gray-100 text-gray-900 active:bg-gray-200' 
                        : 'text-gray-400 cursor-not-allowed'
                      }
                      ${isAvailable && isPast ? 'bg-green-50 hover:bg-green-100' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="flex justify-between p-2 sm:p-3 border-t border-gray-200">
            <button
              onClick={() => handleDateSelect(today)}
              className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded touch-manipulation"
            >
              Today
            </button>
            <button
              onClick={() => handleDateSelect(subDays(today, 1))}
              className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded touch-manipulation"
            >
              Yesterday
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
