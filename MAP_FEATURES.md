# Enhanced Map Features

## Overview
The RiderMap component now includes real-time vehicle tracking and a current location overlay for delivery navigation.

## New Features

### 1. **Vehicle Location Marker**
- Animated gradient marker (indigo to purple)
- Pulsing animation to show it's live
- Custom truck icon
- Popup showing "Your Vehicle - Current Location"

### 2. **Current Location Overlay (Bottom)**
Displays when `showLocationOverlay={true}`:
- **Current Location** - Shows rider's current address with pulsing dot
- **Destination** - Shows delivery address with pin icon
- **ETA** - Estimated time to arrival
- **Distance** - Remaining distance to destination

### 3. **Full-Screen Navigation Mode**
- Dedicated navigation view for active deliveries
- Large map with all features enabled
- Quick action buttons (Recenter, Arrived)
- Gradient header with task type

## Usage Examples

### Basic Map (Task Detail View)
```tsx
<RiderMap 
  start={{ lat: 40.7580, lng: -73.9855 }}  // Pickup location
  end={{ lat: 40.7489, lng: -73.9680 }}    // Dropoff location
/>
```

### Map with Vehicle Location
```tsx
<RiderMap 
  start={{ lat: 40.7580, lng: -73.9855 }}
  end={{ lat: 40.7489, lng: -73.9680 }}
  vehicleLocation={{ lat: 40.7520, lng: -73.9750 }}  // Current vehicle position
/>
```

### Full Navigation Mode (with overlay)
```tsx
<RiderMap 
  start={{ lat: 40.7580, lng: -73.9855 }}
  end={{ lat: 40.7489, lng: -73.9680 }}
  vehicleLocation={{ lat: 40.7520, lng: -73.9750 }}
  showLocationOverlay={true}
  currentAddress="5th Avenue & E 42nd St, New York, NY"
  destinationAddress="123 Main St, Brooklyn, NY"
  estimatedTime="12 mins"
  distance="2.3 miles"
/>
```

## Map Elements

### Markers
1. **Blue Marker** - Pickup location (start point)
2. **Green Marker** - Dropoff location (destination)
3. **Animated Vehicle Marker** - Current rider position (purple gradient with pulse)

### Route Line
- **Color**: Indigo (#6366f1)
- **Width**: 6px
- **Opacity**: 0.8
- Auto-calculated optimal route using Leaflet Routing Machine

### Location Overlay (Bottom Panel)
- **Background**: White with 95% opacity + backdrop blur
- **Border**: Top border with shadow
- **Layout**: Two-column (Current | Destination)
- **Footer**: ETA and distance metrics

## Integration in RiderView

### Task Detail Modal
- Shows map when task has coordinates
- Height: 256px (h-64)
- Vehicle marker appears when status is 'IN_PROGRESS'
- Overlay disabled in detail view (compact mode)

### Full-Screen Navigation
- Triggered by "Open Navigation" button
- Only available when task status is 'IN_PROGRESS'
- Full viewport height
- Location overlay enabled
- Quick actions: Recenter map, Mark as arrived

## Real-Time Updates

To implement live vehicle tracking:

```tsx
// In your component
useEffect(() => {
  const interval = setInterval(() => {
    // Get GPS coordinates from device
    navigator.geolocation.getCurrentPosition((position) => {
      setVehiclePosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  }, 5000); // Update every 5 seconds

  return () => clearInterval(interval);
}, []);
```

## Styling

### Vehicle Marker CSS
```css
- Size: 40x40px
- Background: Linear gradient (indigo to violet)
- Border: 3px white
- Shadow: 0 4px 12px rgba(99, 102, 241, 0.4)
- Animation: Pulse (2s infinite)
```

### Overlay Panel
```css
- Position: Absolute bottom
- Background: white/95 + backdrop-blur-xl
- Padding: 16px
- Border-top: 1px slate-200
- Shadow: 2xl
- Z-index: 1000
```

## Props Reference

```typescript
interface RiderMapProps {
  start: { lat: number; lng: number };           // Required: Pickup coordinates
  end: { lat: number; lng: number };             // Required: Dropoff coordinates
  vehicleLocation?: { lat: number; lng: number }; // Optional: Current vehicle position
  showLocationOverlay?: boolean;                  // Optional: Show bottom overlay (default: false)
  currentAddress?: string;                        // Optional: Current location address
  destinationAddress?: string;                    // Optional: Destination address
  estimatedTime?: string;                         // Optional: ETA display
  distance?: string;                              // Optional: Distance display
}
```

## Mobile Optimization

- Touch-friendly controls
- Scroll wheel zoom disabled (prevents accidental zoom)
- Auto-fit bounds to show entire route
- Responsive overlay layout
- Smooth animations (slide-in, pulse)

## Future Enhancements

- [ ] Turn-by-turn voice navigation
- [ ] Traffic layer overlay
- [ ] Multiple waypoint support
- [ ] Route optimization
- [ ] Offline map caching
- [ ] Speed and heading indicators
- [ ] Geofencing for arrival detection
