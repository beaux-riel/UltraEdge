import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import { Canvas, Path, useCanvasRef, SkPath, Skia } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import { DOMParser } from '@xmldom/xmldom';
import { useAppTheme } from '../../context/ThemeContext';

interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
}

interface GPXViewerProps {
  gpxFile: string | null;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
}

const GPXViewer: React.FC<GPXViewerProps> = ({ 
  gpxFile, 
  width = Dimensions.get('window').width - 32, 
  height = 200,
  strokeColor,
  strokeWidth = 2,
  backgroundColor
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<GPXPoint[]>([]);
  const [elevationProfile, setElevationProfile] = useState<SkPath | null>(null);
  const [routePath, setRoutePath] = useState<SkPath | null>(null);
  const [minEle, setMinEle] = useState<number>(0);
  const [maxEle, setMaxEle] = useState<number>(0);
  const { isDarkMode, theme } = useAppTheme();
  const canvasRef = useCanvasRef();

  useEffect(() => {
    if (!gpxFile) {
      setLoading(false);
      setError('No GPX file provided');
      return;
    }

    const parseGPX = async () => {
      try {
        setLoading(true);
        setError(null);

        // Read the GPX file
        const fileContent = await FileSystem.readAsStringAsync(gpxFile);
        
        // Parse the XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
        
        // Extract track points
        const trackPoints = xmlDoc.getElementsByTagName('trkpt');
        const extractedPoints: GPXPoint[] = [];
        
        for (let i = 0; i < trackPoints.length; i++) {
          const point = trackPoints[i];
          const lat = parseFloat(point.getAttribute('lat') || '0');
          const lon = parseFloat(point.getAttribute('lon') || '0');
          
          // Get elevation if available
          const eleElements = point.getElementsByTagName('ele');
          let ele: number | undefined = undefined;
          
          if (eleElements.length > 0) {
            ele = parseFloat(eleElements[0].textContent || '0');
          }
          
          extractedPoints.push({ lat, lon, ele });
        }
        
        if (extractedPoints.length === 0) {
          throw new Error('No track points found in GPX file');
        }
        
        setPoints(extractedPoints);
        
        // Create paths for visualization
        createPaths(extractedPoints);
        
        setLoading(false);
      } catch (err) {
        console.error('Error parsing GPX:', err);
        setError('Failed to parse GPX file');
        setLoading(false);
      }
    };
    
    parseGPX();
  }, [gpxFile, width, height]);
  
  const createPaths = (points: GPXPoint[]) => {
    if (points.length === 0) return;
    
    // Find min/max coordinates for scaling
    let minLat = points[0].lat;
    let maxLat = points[0].lat;
    let minLon = points[0].lon;
    let maxLon = points[0].lon;
    let minElevation = points[0].ele !== undefined ? points[0].ele : Infinity;
    let maxElevation = points[0].ele !== undefined ? points[0].ele : -Infinity;
    
    points.forEach(point => {
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
      minLon = Math.min(minLon, point.lon);
      maxLon = Math.max(maxLon, point.lon);
      
      if (point.ele !== undefined) {
        minElevation = Math.min(minElevation, point.ele);
        maxElevation = Math.max(maxElevation, point.ele);
      }
    });
    
    setMinEle(minElevation);
    setMaxEle(maxElevation);
    
    // Create route path
    const routePathObj = Skia.Path.Make();
    
    // Scale points to fit the canvas
    const padding = 10;
    const availableWidth = width - (padding * 2);
    const availableHeight = height / 2 - (padding * 2); // Half for map, half for elevation
    
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    
    // Start the path with the first point
    const firstX = padding + ((points[0].lon - minLon) / lonRange) * availableWidth;
    // Flip Y coordinate because Skia's origin is top-left
    const firstY = padding + ((maxLat - points[0].lat) / latRange) * availableHeight;
    routePathObj.moveTo(firstX, firstY);
    
    // Add the rest of the points
    for (let i = 1; i < points.length; i++) {
      const x = padding + ((points[i].lon - minLon) / lonRange) * availableWidth;
      const y = padding + ((maxLat - points[i].lat) / latRange) * availableHeight;
      routePathObj.lineTo(x, y);
    }
    
    setRoutePath(routePathObj);
    
    // Create elevation profile if elevation data exists
    if (minElevation !== Infinity && maxElevation !== -Infinity) {
      const elevationPathObj = Skia.Path.Make();
      const elevationHeight = height / 2 - (padding * 2);
      const elevationRange = maxElevation - minElevation;
      
      // Start the elevation path
      const firstEleX = padding;
      const firstEleY = height / 2 + padding + elevationHeight - 
        (((points[0].ele || minElevation) - minElevation) / elevationRange) * elevationHeight;
      elevationPathObj.moveTo(firstEleX, firstEleY);
      
      // Add points to the elevation path
      for (let i = 1; i < points.length; i++) {
        const x = padding + (i / (points.length - 1)) * availableWidth;
        const y = height / 2 + padding + elevationHeight - 
          (((points[i].ele || minElevation) - minElevation) / elevationRange) * elevationHeight;
        elevationPathObj.lineTo(x, y);
      }
      
      setElevationProfile(elevationPathObj);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: isDarkMode ? '#ffffff' : '#000000', marginTop: 10 }}>
          Loading GPX data...
        </Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5' }]}>
        <Text style={{ color: isDarkMode ? '#ff6b6b' : '#d32f2f' }}>
          {error}
        </Text>
      </View>
    );
  }
  
  if (!gpxFile || points.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: backgroundColor || (isDarkMode ? '#1e1e1e' : '#f5f5f5') }]}>
        <Text style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
          No GPX data available
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: backgroundColor || (isDarkMode ? '#1e1e1e' : '#f5f5f5') }]}>
      <Canvas style={{ width, height }} ref={canvasRef}>
        {/* Route path */}
        {routePath && (
          <Path
            path={routePath}
            color={strokeColor || theme.colors.primary}
            style="stroke"
            strokeWidth={strokeWidth}
          />
        )}
        
        {/* Elevation profile */}
        {elevationProfile && (
          <Path
            path={elevationProfile}
            color={isDarkMode ? '#4fc3f7' : '#0288d1'}
            style="stroke"
            strokeWidth={2}
          />
        )}
      </Canvas>
      
      {/* Elevation labels */}
      {minEle !== Infinity && maxEle !== -Infinity && (
        <View style={styles.elevationLabels}>
          <Text style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: 12 }}>
            Min: {Math.round(minEle)}m
          </Text>
          <Text style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: 12 }}>
            Max: {Math.round(maxEle)}m
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  elevationLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 4,
  }
});

export default GPXViewer;