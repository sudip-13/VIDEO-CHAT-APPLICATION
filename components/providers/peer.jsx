"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

const PeerContext = React.createContext("");

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [userNames, setUserNames] = useState([]);

  const updateUser = async (userName,userEmail) => {
    setUserNames((prev) => [...prev, userName]);
    setJoinedUsers((prev) => [...prev, userEmail]);
  };

  const peer = useMemo(() => {
    if (typeof window !== "undefined") {
      return new RTCPeerConnection();
    }
    return null;
  }, []);

  const createOffer = async () => {
    if (!peer) return null;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    if (!peer) return null;
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAns = async (ans) => {
    await peer.setRemoteDescription(ans);
  };

  const sendStream = async (Stream) => {
    const tracks = Stream.getTracks();
    for (const track of tracks) {
      peer.addTrack(track, Stream);
    }
  };

  const handleTrackEvent = useCallback((ev) => {
    const streams = ev.streams;
    setRemoteStream(streams[0]);
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [peer, handleTrackEvent]);

  // Refs for video elements
  const screenShareRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const videoRef = useRef(null);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
        remoteStream,
        updateUser,
        joinedUsers,
        screenShareRef,
        remoteStreamRef,
        videoRef,
        userNames
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
