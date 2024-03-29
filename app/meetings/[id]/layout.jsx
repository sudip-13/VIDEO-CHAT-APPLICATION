"use client"
import NextTopLoader from "nextjs-toploader";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/components/providers/socket";
import { useSession } from "next-auth/react";
import { usePeer } from "@/components/providers/peer";


export default function Layout({children}){
    const socket = useSocket();
    const screenShareRef = useRef(null);
    const session = useSession();
    const { sendStream, remoteStream,joinedUsers } = usePeer();


    const [name, setName] = useState("");
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [messageText, setMessageText] = useState([]);
    const [email, setEmail] = useState("");
    const [imgUrl, setImageUrl] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    const audioRef = useRef(null);
    const videoRef = useRef(null);

    const [showChatPopup, setShowChatPopup] = useState(false);
    const [showParticipantsPopup, setShowParticipantsPopup] = useState(false);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [stream, setStream] = useState(null);


    const [isRecording, setIsRecording] = useState(false);
    const [audioStream, setAudioStream] = useState(null);
    const [screenShareStream, setScreenShareStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);

    const toggleChatPopup = () => {
        setShowChatPopup(!showChatPopup);
    }
    const toggleInfoPopup = () => setShowInfoPopup(!showInfoPopup);
    const toggleParticipantPopup = () => setShowParticipantsPopup(!showParticipantsPopup);

    const toggleRecording = () => {
        setIsRecording(prevState => !prevState);
    };

    const toggleVideo = async () => {
        setIsVideoEnabled(prevState => !prevState);
        sendStream(stream);
    };

    const getUser = useCallback(() => {
        try {
            setEmail(session.data?.user?.email ?? '');
            setName(session.data?.user?.name ?? '');
            setImageUrl(session.data?.user?.image ?? '');
        } catch (error) {
            console.log("User fetching failed");
        }
    }, [session]);

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            setIsScreenSharing(prevState => !prevState);
            try {
                const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                });
                setScreenShareStream(mediaStream);
                if (screenShareRef.current) {
                    screenShareRef.current.srcObject = mediaStream;
                }

            } catch (error) {
                console.error("Error accessing screen sharing:", error);
            }
        } else {
            if (screenShareStream) {
                screenShareStream.getTracks().forEach(track => track.stop());
                setScreenShareStream(null);
            }
        }
    };

    const disconnectCall = async () => {
        // 1. Stop media streams
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }
    };
    const sendMessage = () => {
        if (messageInput.trim() !== "") {

            socket.emit("message", { email:joinedUsers,message: messageInput });
            setMessageInput("");
        }
        socket.on("message", ({ message }) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });
        return () => {
            socket.disconnect();
        }
    };

    const handleMessageShow = async(message)=>{
        setMessageText(message);
    }   

    useEffect(() => {

        socket.on("message",handleMessageShow)

        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const startVideo = async () => {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                setStream(videoStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = videoStream;

                }

            } catch (error) {
                console.error("Error accessing video devices:", error);
            }
        };

        const startAudio = async () => {
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                setAudioStream(audioStream);
            } catch (error) {
                console.error("Error accessing audio devices:", error);
            }
        };

        startAudio();

        if (isVideoEnabled) {
            startVideo();
        }

        getUser();

        return () => {
            clearInterval(intervalId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());

            }
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
            if (screenShareStream) {
                screenShareStream.getTracks().forEach(track => track.stop());
            }
        };

    }, [isVideoEnabled, isScreenSharing, getUser, sendStream]);

    return (
        <>
            <NextTopLoader />
            <div className="flex">
                <div className="mt-5 ml-5 max-w-5xl">
                    {isScreenSharing ? (
                        <video
                            ref={screenShareRef}
                            autoPlay
                            playsInline
                            style={{ height: "575px" }}
                        />
                    ) : (
                        <p></p>//Should be removed
                    )}
                </div>
                <div className="ml-5 mr-5 mt-5 max-w-lg flex flex-wrap">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ height: "520px" }}
                    />
                    <div className="bg-white mb-5 border border-gray-200 h-44 w-52 mr-3 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                        {isVideoEnabled ? (
                            <video
                                className="pt-2"
                                ref={remoteStream}
                                autoPlay
                                playsInline
                            />
                        ) : (

                            <div className="flex flex-col items-center">
                                <img
                                    className="w-24 h-24 mb-3 mt-2 rounded-full shadow-lg"
                                    src={imgUrl}
                                    alt="My-image"
                                />
                                <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">
                                    {name}
                                </h5>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Meeting Hosted
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="bg-white mb-5 border border-gray-200 h-44 w-52 mr-3 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex flex-col items-center">
                            <img
                                className="w-24 h-24 mb-3 mt-2 rounded-full shadow-lg"
                                src="https://miro.medium.com/v2/resize:fit:495/0*xFuo_UNWchLZ8bqS.jpeg"
                                alt="Bonnie image"
                            />
                            <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">
                                Bonnie Green
                            </h5>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Visual Designer
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-12 ml-5 fixed bottom-8">
                <ul className="flex">
                    <li className="w-96">{name} | {currentTime.toLocaleString()}</li>

                    {/* mute button */}
                    <li className="ml-56">
                        <button
                            title="mute"
                            onClick={toggleRecording}
                            className="bg-white rounded-xl ml-5"
                        >
                            {isRecording ? (
                                <svg
                                    className="h-10 w-14 bg-red-500 rounded-lg hover:bg-slate-400 hover:rounded-xl"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM592-482 360-714v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-124q-104-14-172-92.5T200-520h80q0 83 58.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 38.5T520-244v124h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
                                </svg>
                            ) : (
                                <svg
                                    className="h-10 w-14 hover:bg-slate-400 hover:rounded-xl"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm-40 280v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Z" />
                                </svg>
                            )}
                        </button>

                        {/* video call button */}
                        <button onClick={toggleVideo} className="bg-white rounded-xl ml-5" title="webcam">
                            {isVideoEnabled ? (
                                <svg
                                    className="h-10 w-14  hover:bg-slate-400 hover:rounded-xl"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Z" />
                                </svg>
                            ) : (
                                <svg
                                    className="h-10 w-14 bg-red-500 rounded-lg hover:bg-slate-400 hover:rounded-xl"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="M880-260 720-420v67L273-800h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM160-800l560 560q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z" />
                                </svg>
                            )}
                        </button>

                        {/* screen share */}
                        <button
                            title="screen share"
                            onClick={toggleScreenShare}
                            className="bg-white rounded-xl ml-5"
                        >
                            {!isScreenSharing ? (

                                <svg
                                    className="h-10 w-14 hover:bg-slate-400 bg-green-500 rounded-xl hover:rounded-xl"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="M440-320h80v-166l64 63 57-57-161-160-160 160 57 56 63-63v167ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z" />
                                </svg>
                            ) : (
                                <svg
                                    className="h-10 w-14 bg-red-500 rounded-xl hover:bg-slate-400 hover:rounded-xl"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="m820-28-92-92H40v-80h607l-40-40H160q-33 0-56.5-23.5T80-320v-446l-52-54 56-56L876-84l-56 56ZM400-446l-73-74q-5 9-6 19t-1 21v80h80v-46Zm428 200L577-497l63-63-120-120v80h-46L234-840h566q33 0 56.5 23.5T880-760v440q0 26-14.5 45.5T828-246Z" />
                                </svg>
                            )}
                        </button>
                        {/* call end button */}
                        <button className="rounded-xl ml-5" title="end call" onClick={disconnectCall}>
                            <svg
                                className="h-10 w-14 bg-red-400 rounded-xl hover:bg-red-700"
                                xmlns="http://www.w3.org/2000/svg"
                                height="24"
                                viewBox="0 -960 960 960"
                                width="24"
                            >
                                <path d="M480-640q118 0 232.5 47.5T916-450q12 12 12 28t-12 28l-92 90q-11 11-25.5 12t-26.5-8l-116-88q-8-6-12-14t-4-18v-114q-38-12-78-19t-82-7q-42 0-82 7t-78 19v114q0 10-4 18t-12 14l-116 88q-12 9-26.5 8T136-304l-92-90q-12-12-12-28t12-28q88-95 203-142.5T480-640Z" />
                            </svg>
                        </button>

                        {/* info button */}
                        <button
                            title="info"
                            onClick={toggleInfoPopup}
                            className="bg-white rounded-xl ml-96"
                        >
                            <svg
                                className="h-10 w-14 hover:bg-slate-400 hover:rounded-xl"
                                xmlns="http://www.w3.org/2000/svg"
                                height="24"
                                viewBox="0 -960 960 960"
                                width="24"
                            >
                                <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
                            </svg>
                        </button>

                        {/* chat button */}
                        <button
                            title="live chat"
                            onClick={toggleChatPopup}
                            className="bg-white rounded-xl ml-5"
                        >

                            <svg
                                className="h-10 w-14 hover:bg-slate-400 hover:rounded-xl"
                                xmlns="http://www.w3.org/2000/svg"
                                height="24"
                                viewBox="0 -960 960 960"
                                width="24"
                            >
                                <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm160-320h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80Z" />
                            </svg>
                        </button>

                        {/* participants button */}
                        <button
                            title="participants"
                            onClick={toggleParticipantPopup}
                            className="bg-white rounded-xl ml-5"
                        >
                            <svg
                                className="h-10 w-14 hover:bg-slate-400 hover:rounded-xl"
                                xmlns="http://www.w3.org/2000/svg"
                                height="24"
                                viewBox="0 -960 960 960"
                                width="24"
                            >
                                <path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM360-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm400-160q0 66-47 113t-113 47q-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113Z" />
                            </svg>
                        </button>
                    </li>
                </ul>
            </div>

            {showChatPopup && (
                <div className="fixed bottom-28 right-0 mr-12 h-4/5 w-3/12 mb-5 p-4 bg-black border rounded-lg shadow-lg">
                    <nav>
                        <ul className="flex justify-end flex-row-reverse">
                            <li className="">
                                <svg
                                    onClick={() => setShowChatPopup(false)}
                                    className="bg-white hover:bg-red-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                </svg>
                            </li>
                            <li>
                                <h3 className="text-xl font-bold  mb-2 mr-56">Live Chat</h3>
                            </li>
                        </ul>
                    </nav>
                    <p>{messageText}</p>
                    <div>
                        <form className="bottom-36 fixed">
                            <label htmlFor="chat" className="sr-only">
                                <ul>
                                    {messages.map((msg, index) => (
                                        <li key={index}>{msg}</li>
                                    ))}
                                </ul>
                            </label>
                            <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <input
                                    id="chat"
                                    className="block mx-4  p-2.5 w-64 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Your message..."
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                ></input>
                                <button
                                    type="button"
                                    onClick={sendMessage}
                                    className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600"
                                >
                                    <svg
                                        className="w-5 h-5 rotate-90 rtl:-rotate-90"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 18 20"
                                    >
                                        <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
                                    </svg>
                                    <span className="sr-only">Send message</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showParticipantsPopup && (
                <div className="overflow-y-scroll fixed bottom-28 right-0 mr-12 h-4/5 w-3/12 mb-5 p-4 bg-black border rounded-lg shadow-lg">
                    <nav className="fixed">
                        <ul className="flex">
                            <li>
                                <h3 className="text-xl font-bold  mb-2 mr-40">
                                    All Participants
                                </h3>
                            </li>
                            <li>
                                <svg
                                    onClick={() => setShowParticipantsPopup(false)}
                                    className="bg-white hover:bg-red-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                </svg>
                            </li>
                        </ul>
                    </nav>
                    <ul className="ml-5 mt-10 list-decimal text-gray-400">
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                        <li className="mt-2">Mukesh Gupta</li>
                    </ul>
                </div>
            )}
            {showInfoPopup && (
                <div className="fixed bottom-28 w-96 right-0 mr-12 mb-5 p-4 bg-black border rounded-lg shadow-lg">
                    <nav>
                        <ul className="flex justify-end flex-row-reverse">
                            <li className="">
                                <svg
                                    onClick={() => setShowInfoPopup(false)}
                                    className="bg-white hover:bg-red-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24"
                                    viewBox="0 -960 960 960"
                                    width="24"
                                >
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                </svg>
                            </li>
                            <li className="mr-52">
                                <h3 className="text-xl font-bold  mb-2">Information</h3>
                            </li>
                        </ul>
                    </nav>
                    <div className="flex">
                        <p className="text-gray-500 mr-5">{"http://localhost:5000/"}</p>
                        <button>
                            <svg
                                className="w-5 h-5"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 18 20"
                            >
                                <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            {children}
        </>

    );
}