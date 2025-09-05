import Map from "./components/Map.tsx";
import Header from "./components/Header.tsx";
import {useEffect} from "react";
import toast, {Toaster} from "react-hot-toast";
import {supabase} from "./config/supabase.ts";
import {Button, Input, Modal} from "antd";
import Cookies from "js-cookie";
import {useAppStore} from "./store";

const isDevMode = import.meta.env.MODE === "development";

const App = () => {
    const {
        setPoiList,
        setGangs,
        isModalVisible,
        setIsModalVisible,
        enteredPassword,
        setEnteredPassword,
        allowed,
        setAllowed,
        loading,
        setLoading,
        poiList
    } = useAppStore();

    // Check cookie on mount
    useEffect(() => {
        const hasAccess = Cookies.get("accessGranted");
        if (hasAccess === "true") {
            setAllowed(true);
            setIsModalVisible(false);
        }
    }, [setAllowed, setIsModalVisible]);

    // Fetch gangs
    useEffect(() => {
        (async () => {
            const {data: gangs} = await supabase.from("gangs").select("*");
            if (gangs) setGangs(gangs);
        })();
    }, [setGangs]);

    const handleCheckPassword = async () => {
        if (!enteredPassword.trim()) {
            toast.error("Please enter the password.");
            return;
        }

        setLoading(true);

        const {data, error} = await supabase
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
            Cookies.set("accessGranted", "true", {expires: 30});
        } else {
            toast.error("Incorrect password!");
        }
    };

    useEffect(() => {
        if (!allowed) return;
        (async () => {
            const {data: pois} = await supabase.from("pois").select("*");
            if (pois) setPoiList(pois);
            console.log(poiList )
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
                    <Header/>
                    <Map
                        isDevMode={isDevMode}
                    />
                </main>
            )}

            <Toaster position="top-center" reverseOrder={false}/>
        </>
    );
};

export default App;
