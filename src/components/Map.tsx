import { useRef } from 'react';
import { MapContainer, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () => {
    const mapRef = useRef(null);
    const imageUrl = '/images/map.png';

    // Image dimensions
    const imageWidth = 5000;
    const imageHeight = 5000;

    const bounds = [
        [0, 0],
        [imageHeight, imageWidth]
    ];

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div style={{
                width: '100%',
                height: '100vh',
            }}>
                <MapContainer
                    ref={mapRef}
                    center={[imageHeight / 2, imageWidth / 2]}
                    zoom={0}
                    minZoom={-2}
                    maxZoom={2}
                    crs={L.CRS.Simple}
                    style={{ height: '100%', width: '100%' }}
                    maxBounds={bounds}
                    maxBoundsViscosity={1.0}
                    whenCreated={(mapInstance) => {
                        mapInstance.fitBounds(bounds, { padding: [0, 0] });
                    }}
                >
                    <ImageOverlay
                        url={imageUrl}
                        bounds={bounds}
                    />
                </MapContainer>
            </div>
        </div>
    );
};

export default Map;
