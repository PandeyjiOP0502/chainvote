import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const DateTimePicker = ({ 
  value, 
  onChange, 
  label, 
  placeholder = "Select date & time",
  minDate,
  maxDate,
  required = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const containerRef = useRef(null);

  // Parse existing value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      setDateValue(`${year}-${month}-${day}`);
      setTimeValue(`${hours}:${minutes}`);
    } else {
      setDateValue('');
      setTimeValue('');
    }
  }, [value]);

  // Handle date change
  const handleDateChange = (dateStr) => {
    setDateValue(dateStr);
    if (dateStr && timeValue) {
      const [year, month, day] = dateStr.split('-');
      const [hours, minutes] = timeValue.split(':');
      const newDate = new Date(year, month - 1, day, hours, minutes);
      onChange(newDate.toISOString());
    }
  };

  // Handle time change
  const handleTimeChange = (timeStr) => {
    setTimeValue(timeStr);
    if (dateValue && timeStr) {
      const [year, month, day] = dateValue.split('-');
      const [hours, minutes] = timeStr.split(':');
      const newDate = new Date(year, month - 1, day, hours, minutes);
      onChange(newDate.toISOString());
    }
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayValue = () => {
    if (!dateValue || !timeValue) return placeholder;
    
    const [year, month, day] = dateValue.split('-');
    const [hours, minutes] = timeValue.split(':');
    const date = new Date(year, month - 1, day, hours, minutes);
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const inputStyle = {
    padding: '10px 12px',
    background: 'rgba(8,18,8,0.8)',
    border: '1px solid rgba(34,197,94,0.18)',
    borderRadius: 8,
    color: '#fff',
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 11,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'rgba(10,20,10,0.95)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 8,
    padding: 16,
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ 
          color: '#9ca3af', 
          fontFamily: "'IBM Plex Mono',monospace", 
          fontSize: 9, 
          display: 'block', 
          marginBottom: 5 
        }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={inputStyle}
      >
        {formatDisplayValue()}
      </div>

      {isOpen && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={dropdownStyle}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ 
                color: '#6b7280', 
                fontFamily: "'IBM Plex Mono',monospace", 
                fontSize: 9, 
                display: 'block', 
                marginBottom: 4 
              }}>
                Date
              </label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => handleDateChange(e.target.value)}
                min={minDate}
                max={maxDate}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  background: 'rgba(15,30,15,0.8)'
                }}
              />
            </div>
            <div>
              <label style={{ 
                color: '#6b7280', 
                fontFamily: "'IBM Plex Mono',monospace", 
                fontSize: 9, 
                display: 'block', 
                marginBottom: 4 
              }}>
                Time (HH:MM)
              </label>
              <input
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                step={60} // 1 minute steps
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  background: 'rgba(15,30,15,0.8)'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                padding: '6px 12px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 6,
                color: '#86efac',
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DateTimePicker;