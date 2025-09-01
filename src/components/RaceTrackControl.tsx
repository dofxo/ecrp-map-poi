import {useEffect, useRef, useState} from "react";
import toast from "react-hot-toast";
import {CheckOutlined, EditOutlined} from "@ant-design/icons";
import {supabase} from "../config/supabase.ts";
import {Button} from "antd";

interface RaceTrackControlProps {
    //@ts-ignore
    map: L.Map | null; // Leaflet map instance
    setTracks: React.Dispatch<React.SetStateAction<{
        id: string
        name: string
        boxes: [number, number][]
        addedBy: string
        color: string
    }[]>>
}

const RaceTrackControl: React.FC<RaceTrackControlProps> = ({map, setTracks}) => {
    const [isNaming, setIsNaming] = useState(false);
    const [trackName, setTrackName] = useState("");
    const [addedBy, setAddedBy] = useState("");
    const [isDrawing, setIsDrawing] = useState(false);
    const [trackColor, setTrackColor] = useState("#ff0000"); // default red

    //@ts-ignore
    const currentPolylineRef = useRef<L.Polyline | null>(null);
    const currentPointsRef = useRef<[number, number][]>([]);
    const tracksBufferRef = useRef<[number, number][][]>([]);

    // Handle drawing toggle on map click
    useEffect(() => {
        if (!map) return;

        //@ts-ignore
        const toggleDrawing = (e: L.LeafletMouseEvent) => {
            if (!isNaming) return;

            if (!isDrawing) {
                // Start new track
                currentPointsRef.current = [[e.latlng.lat, e.latlng.lng]];
                //@ts-ignore
                currentPolylineRef.current = L.polyline(currentPointsRef.current, {
                    color: trackColor,
                    weight: 4
                }).addTo(map);

                setIsDrawing(true);
                toast("Drawing started! Click again to stop.", {icon: <EditOutlined/>});
            } else {
                // Stop track and save to buffer
                if (currentPointsRef.current.length > 1) {
                    tracksBufferRef.current.push([...currentPointsRef.current]);
                    toast.success(`Track finished!`);
                }

                setIsDrawing(false);
                currentPointsRef.current = [];
                currentPolylineRef.current = null;
            }
        };

        //@ts-ignore
        const onMouseMove = (e: L.LeafletMouseEvent) => {
            if (isDrawing && currentPolylineRef.current) {
                currentPointsRef.current.push([e.latlng.lat, e.latlng.lng]);
                currentPolylineRef.current.setLatLngs(currentPointsRef.current);
            }
        };

        map.on("click", toggleDrawing);
        map.on("mousemove", onMouseMove);

        return () => {
            map.off("click", toggleDrawing);
            map.off("mousemove", onMouseMove);
        };
    }, [map, isDrawing, isNaming, trackColor]);

    const startNewTrack = () => setIsNaming(true);

    const submitTrack = async () => {
        if (!tracksBufferRef.current.length) return toast.error("No tracks drawn");
        if (!trackName.trim()) return toast.error("Please enter a track name before submitting");
        if (!addedBy.trim()) return toast.error("Please enter your name");

        try {
            // Keep track as one object with multiple segments
            const newTrack = {
                name: trackName,
                boxes: tracksBufferRef.current,
                color: trackColor,
                addedBy,
            };

            await supabase.from("raceTracks").insert([newTrack]).select();

            //@ts-ignore
            setTracks(prev => [...prev, newTrack]);

            toast.success(`Track saved!`);

            // Reset everything
            tracksBufferRef.current = [];
            currentPointsRef.current = [];
            if (currentPolylineRef.current) {
                map?.removeLayer(currentPolylineRef.current);
                currentPolylineRef.current = null;
            }
            setTrackName("");
            setAddedBy("");
            setIsNaming(false);
            setIsDrawing(false);
        } catch (err) {
            console.error("Error submitting track", err);
            toast.error("Failed to submit track");
        }
    };

    return (
        <div
            className="leaflet-control leaflet-bar bg-white p-3 rounded shadow-lg flex flex-col items-center gap-2"
            style={{
                position: "absolute",
                top: 20,
                right: 500,
                userSelect: "none",
                zIndex: 1000,
                minWidth: 180,
            }}
        >
            {!isNaming ? (
                <>
                    <div className="text-xs text-gray-600 mb-1 text-center">
                        Click "Create New Race Track", enter your name, then click on the map to start/stop drawing.
                    </div>
                    <button
                        onClick={startNewTrack}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                        Create New Race Track
                    </button>
                </>
            ) : (
                <>
                    <div className="text-xs text-gray-600 mb-1 text-center">
                        Click on the map to start drawing. Click again to stop. Then submit your track.
                    </div>
                    <input
                        type="text"
                        placeholder="Enter track name"
                        value={trackName}
                        onChange={(e) => setTrackName(e.target.value)}
                        className="border p-1 rounded text-sm w-full"
                    />
                    <input
                        type="text"
                        placeholder="Added By"
                        value={addedBy}
                        onChange={(e) => setAddedBy(e.target.value)}
                        className="border p-1 rounded text-sm w-full"
                    />
                    <div className="flex items-center gap-2 w-full">
                        <label className="text-xs">Track Color:</label>
                        <input
                            type="color"
                            value={trackColor}
                            onChange={(e) => setTrackColor(e.target.value)}
                            className="w-12 h-6 p-0 border-none"
                        />
                    </div>
                    {isNaming && !isDrawing && (
                        <div className="leaflet-control custom-submit">
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={submitTrack}
                            >
                                Submit Track
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RaceTrackControl;
