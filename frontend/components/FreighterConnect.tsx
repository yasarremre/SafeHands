"use client";

import { useState, useEffect } from "react";
import { isConnected, getAddress, setAllowed } from "@stellar/freighter-api";
import toast from "react-hot-toast";

export default function FreighterConnect({
    onConnect,
}: {
    onConnect: (address: string) => void;
}) {
    const [address, setAddress] = useState<string>("");
    const [isWalletInstalled, setIsWalletInstalled] = useState<boolean>(true);
    const [showManual, setShowManual] = useState(false);
    const [manualAddr, setManualAddr] = useState("");

    useEffect(() => {
        async function checkWallet() {
            const connected = await isConnected();
            if (!connected) {
                setIsWalletInstalled(false);
                return;
            }
            try {
                const result = await getAddress();
                if (result && result.address) {
                    setAddress(result.address);
                    onConnect(result.address);
                }
            } catch (e) {
                console.error("Failed to get address", e);
            }
        }
        checkWallet();
    }, [onConnect]);

    const connectWallet = async () => {
        console.log("Connect Wallet clicked");
        if (!isWalletInstalled) {
            toast.error("Freighter wallet is not detected. Opening download page...");
            window.open("https://www.freighter.app/", "_blank");
            return;
        }
        try {
            console.log("Forcing permission request...");
            await setAllowed(); // Force the permission popup

            const result = await getAddress();
            console.log("Freighter response:", result);

            const addr = typeof result === 'string' ? result : result?.address;

            if (!addr || addr === "") {
                toast.error("Address is still empty. Please ensure you clicked 'Share Address' in the Freighter popup.");
                return;
            }

            setAddress(addr);
            onConnect(addr);
        } catch (e: unknown) {
            console.error("Freighter Connection Failed:", e);
            const message = e instanceof Error ? e.message : String(e);
            toast.error(`Connection Failed: ${message}`);
        }
    };

    const handleManualSubmit = () => {
        if (manualAddr.length > 0) {
            setAddress(manualAddr);
            onConnect(manualAddr);
        }
    };

    if (address) {
        return (
            <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm text-gray-700 truncate max-w-[150px]">
                    {address}
                </span>
                <button
                    onClick={() => { setAddress(""); onConnect(""); }}
                    className="text-xs text-red-500 hover:underline ml-2"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    if (showManual) {
        return (
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Enter Stellar Address (G...)"
                    className="border-2 border-black px-2 py-2 text-sm w-48"
                    value={manualAddr}
                    onChange={(e) => setManualAddr(e.target.value)}
                />
                <button
                    onClick={handleManualSubmit}
                    className="bg-black text-white px-3 py-2 font-bold text-sm hover:bg-gray-800 border-2 border-black"
                >
                    OK
                </button>
                <button
                    onClick={() => setShowManual(false)}
                    className="text-xs text-gray-500 underline ml-1"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end">
            <button
                onClick={connectWallet}
                className="bg-black text-white px-6 py-2 font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors border-2 border-black active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
                {isWalletInstalled ? "Connect Wallet" : "Install Freighter"}
            </button>
            <button
                onClick={() => setShowManual(true)}
                className="text-[10px] text-gray-500 underline mt-1 hover:text-black"
            >
                Or enter address manually
            </button>
        </div>
    );
}
