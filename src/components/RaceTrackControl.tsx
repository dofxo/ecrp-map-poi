import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {CheckOutlined, EditOutlined, RedoOutlined} from "@ant-design/icons";
import { supabase } from "../config/supabase.ts";
import { Button, Modal, Form, Input, ColorPicker, Alert } from "antd";

interface RaceTrackControlProps {
    //@ts-ignore
    map: L.Map | null; // Leaflet map instance
    setTracks: React.Dispatch<
        React.SetStateAction<
            {
                id: string;
                name: string;
                boxes: [number, number][][];
                addedBy: string;
                color: string;
            }[]
        >
    >;
    setIsNaming: React.Dispatch<React.SetStateAction<boolean>>;
    isNaming: boolean;
}

const RaceTrackControl: React.FC<RaceTrackControlProps> = ({
                                                               isNaming,
                                                               setIsNaming,
                                                               map,
                                                               setTracks,
                                                           }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [trackMeta, setTrackMeta] = useState<{
        name: string;
        addedBy: string;
        color: string;
    } | null>(null);

    const [form] = Form.useForm();

    // drawing refs
    //@ts-ignore
    const currentPolylineRef = useRef<L.Polyline | null>(null);
    const currentPointsRef = useRef<[number, number][]>([]);
    const tracksBufferRef = useRef<[number, number][][]>([]);
    //@ts-ignore
    const finishedPolylinesRef = useRef<L.Polyline[]>([]);

    // open modal automatically when isNaming = true
    useEffect(() => {
        if (isNaming) {
            setModalOpen(true);
        }
    }, [isNaming]);

    // handle drawing
    useEffect(() => {
        if (!map) return;

        //@ts-ignore
        const toggleDrawing = (e: L.LeafletMouseEvent) => {
            if (!trackMeta) return; // only allow drawing after meta submitted

            if (!isDrawing) {
                currentPointsRef.current = [[e.latlng.lat, e.latlng.lng]];
                //@ts-ignore
                currentPolylineRef.current = L.polyline(currentPointsRef.current, {
                    color: trackMeta.color,
                    weight: 4,
                }).addTo(map);

                setIsDrawing(true);
                toast("Drawing started! Click again to stop.", {
                    icon: <EditOutlined />,
                });
            } else {
                if (currentPointsRef.current.length > 1) {
                    tracksBufferRef.current.push([...currentPointsRef.current]);
                    if (currentPolylineRef.current) {
                        finishedPolylinesRef.current.push(currentPolylineRef.current);
                    }
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
    }, [map, isDrawing, trackMeta]);

    const handleMetaSubmit = () => {
        form
            .validateFields()
            .then((values) => {
                setTrackMeta({
                    name: values.name,
                    addedBy: values.addedBy,
                    color: values.color.toHexString?.() || values.color,
                });
                setModalOpen(false);
                toast("Now click on the map to draw your track!", {
                    icon: <EditOutlined />,
                });
            })
            .catch(() => {});
    };

    const undoLastSegment = () => {
        if (!tracksBufferRef.current.length) {
            return toast.error("No segments to undo");
        }

        // remove last track from buffer
        tracksBufferRef.current.pop();

        // remove last polyline from map
        const lastPolyline = finishedPolylinesRef.current.pop();
        if (lastPolyline && map) {
            map.removeLayer(lastPolyline);
        }

        toast("Last segment removed", { icon: "↩️" });
    };

    const submitTrack = async () => {
        if (!tracksBufferRef.current.length) {
            return toast.error("No tracks drawn");
        }
        if (!trackMeta) return;

        setSubmitting(true); // ✅ start loading
        try {
            const newTrack = {
                name: trackMeta.name,
                boxes: tracksBufferRef.current,
                color: trackMeta.color,
                addedBy: trackMeta.addedBy,
            };

            await supabase.from("raceTracks").insert([newTrack]).select();

            //@ts-ignore
            setTracks((prev) => [...prev, newTrack]);

            toast.success("Track saved!");
            setTrackMeta(null);
            setIsNaming(false);
            setIsDrawing(false);
        } catch (err) {
            console.error("Error submitting track", err);
            toast.error("Failed to submit track");
        } finally {
            setSubmitting(false); // ✅ stop loading
            // reset refs
            tracksBufferRef.current = [];
            currentPointsRef.current = [];
            finishedPolylinesRef.current.forEach((poly) => map?.removeLayer(poly));
            finishedPolylinesRef.current = [];
            if (currentPolylineRef.current) {
                map?.removeLayer(currentPolylineRef.current);
                currentPolylineRef.current = null;
            }
        }
    };

    return (
        <>
            <Modal
                title="Track Information"
                open={modalOpen}
                onOk={handleMetaSubmit}
                onCancel={() => {
                    setModalOpen(false);
                    setIsNaming(false);
                }}
                okText="Start Drawing"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Track Name"
                        rules={[{ required: true, message: "Please enter a track name" }]}
                    >
                        <Input placeholder="Enter track name" />
                    </Form.Item>

                    <Form.Item
                        name="addedBy"
                        label="Added By"
                        rules={[{ required: true, message: "Please enter your name" }]}
                    >
                        <Input placeholder="Your name" />
                    </Form.Item>

                    <Form.Item
                        name="color"
                        label="Track Color"
                        initialValue="#ff0000"
                        rules={[{ required: true }]}
                    >
                        <ColorPicker defaultValue="#ff0000" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* HINT BOX after modal closes */}
            {isNaming && trackMeta && (
                <div
                    style={{
                        position: "absolute",
                        top: 20,
                        right: "50%",
                        transform: "translateX(50%)",
                        zIndex: 1000,
                    }}
                >
                    <Alert
                        message="Drawing Instructions"
                        description={
                            <div style={{ marginTop: 8 }}>
                                <p style={{ fontSize: 12, marginBottom: 8 }}>
                                    Click on the map to start drawing.
                                    Click again to stop.
                                    Repeat to add more segments.
                                </p>
                                <Button
                                    type="default"
                                    onClick={undoLastSegment}
                                    block
                                    icon={<RedoOutlined />}
                                    style={{ marginBottom: 8 }}
                                    danger
                                >
                                    Undo Last Segment
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={submitTrack}
                                    block
                                    loading={submitting}
                                    disabled={submitting}
                                >
                                    Submit Track
                                </Button>
                            </div>
                        }
                        type="info"
                        showIcon
                    />
                </div>
            )}
        </>
    );
};

export default RaceTrackControl;
