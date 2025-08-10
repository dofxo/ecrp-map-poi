import Map from "./components/Map.tsx";
import Header from "./components/Header.tsx";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { poiTypeKey } from "./data/poiTypes.ts";
import { supabase } from "./config/supabase.ts";
import { Modal, Input, Button } from "antd";
import Cookies from "js-cookie";

export interface Poi {
    poiName: string;
    adderName: string;
    latLng: number[];
    poiType: poiTypeKey;
    todayDate: string;
    poiGang: string;
}

const isDevMode = import.meta.env.MODE === "development";

const App = () => {
    const [isClick, setIsClick] = useState(false);
    //@ts-ignore
    const [poiList, setPoiList] = useState<Poi[]>([]);
    const [showTerritory, setShowTerritory] = useState<boolean>(true);
    const [showDropPoints, setShowDropPoints] = useState(true);
    const [gangs,setGangs] = useState<any[]>([]);
    const [filteredGangs, setFilteredGangs] = useState("");

    const [isModalVisible, setIsModalVisible] = useState(true);
    const [enteredPassword, setEnteredPassword] = useState("");
    const [allowed, setAllowed] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check cookie on mount
    useEffect(() => {
        const hasAccess = Cookies.get("accessGranted");
        if (hasAccess === "true") {
            setAllowed(true);
            setIsModalVisible(false);
        }
    }, []);

    // Add gangs to state
    useEffect(() => {
        (async () => {
            const { data: gangs } = await supabase
                .from('gangs')
                .select('*')
            //@ts-ignore
            setGangs(gangs)
        })()
    })

    useEffect(() => {

    }, [filteredGangs]);

    const handleCheckPassword = async () => {
        if (!enteredPassword.trim()) {
            toast.error("Please enter the password.");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase
            .from("enteringPw")
            .select("password")
            .single();

        setLoading(false);

        if (error) {
            toast.error("Error fetching password from server.");
            console.error(error);
            return;
        }

        if (data?.password === enteredPassword) {
            toast.success("Access granted!");
            setAllowed(true);
            setIsModalVisible(false);
            Cookies.set("accessGranted", "true", { expires: 1 }); // Expires in 1 day
        } else {
            toast.error("Incorrect password!");
        }
    };

    useEffect(() => {
        if (!allowed) return;

        (async () => {
            const { data: pois } = await supabase.from("pois").select("*");

            //@ts-ignore
            setPoiList(pois);
        })();
    }, [allowed]);

    return (
        <>
            {/* Password Modal */}
            <Modal
                title="Enter Access Password"
                open={isModalVisible}
                closable={false}
                maskClosable={false}
                footer={[
                    <Button
                        key="submit"
                        type="primary"
                        loading={loading}
                        onClick={handleCheckPassword}
                    >
                        Submit
                    </Button>,
                ]}
            >
                <Input.Password
                    placeholder="Password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    onPressEnter={handleCheckPassword}
                />
            </Modal>

            {allowed && (
                <main>
                    <Header
                        setShowDropPoints={setShowDropPoints}
                        showTerritory={showTerritory}
                        setShowTerritory={setShowTerritory}
                        setIsClick={setIsClick}
                        isClick={isClick}
                        gangs={gangs}
                        setFilteredGangs={setFilteredGangs}
                    />
                    <Map
                        gangs={gangs}
                        filteredGangs={filteredGangs}
                        showDropPoints={showDropPoints}
                        isDevMode={isDevMode}
                        showTerritory={showTerritory}
                        poiList={poiList}
                        setPoiList={setPoiList}
                        setIsClick={setIsClick}
                        isClick={isClick}
                    />
                </main>
            )}

            <Toaster position="top-center" reverseOrder={false} />
        </>
    );
};

export default App;
