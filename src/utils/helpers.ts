// Simple UUID generator for React Native
export const generateUUID = () => {
  // RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Format date from MM/DD/YYYY to "Apr 7, 2025"
export const formatDate = (dateString) => {
  if (!dateString) return "";

  let dateObj;
  
  // Handle different date formats
  if (typeof dateString === 'string') {
    // Check if it's in ISO format (YYYY-MM-DD)
    if (dateString.includes('-')) {
      dateObj = new Date(dateString);
    } else {
      // Assume MM/DD/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Month is 0-indexed in Date constructor
        dateObj = new Date(parts[2], parts[0] - 1, parts[1]);
      } else {
        return dateString; // Return as is if format is unknown
      }
    }
  } else if (dateString instanceof Date) {
    dateObj = dateString;
  } else {
    return ""; // Return empty string for invalid input
  }
  
  // Format the date
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
};

// Format time string (HH:MM:SS or HH:MM) to display format
export const formatTime = (timeString) => {
  if (!timeString) return "";
  
  // If it's already in HH:MM or HH:MM:SS format, return it
  if (typeof timeString === 'string' && timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
    // Split the time string
    const parts = timeString.split(':');
    
    // Format hours and minutes
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    
    // Return formatted time
    return `${hours}:${minutes}`;
  }
  
  return timeString;
};

// Format distance with appropriate unit
export const formatDistance = (distance, unit = 'miles') => {
  if (distance === undefined || distance === null) return "";
  
  const numDistance = parseFloat(distance);
  if (isNaN(numDistance)) return distance;
  
  return `${numDistance.toFixed(1)} ${unit}`;
};

// Format elevation with appropriate unit
export const formatElevation = (elevation, unit = 'ft') => {
  if (elevation === undefined || elevation === null) return "";
  
  const numElevation = parseFloat(elevation);
  if (isNaN(numElevation)) return elevation;
  
  return `${Math.round(numElevation).toLocaleString()} ${unit}`;
};