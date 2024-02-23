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
  const [remoteStreams, setRemoteStreams] = useState({});
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [userNames, setUserNames] = useState([]);

  const updateUser = async (userName, userEmail) => {
    setUserNames((prev) => [...prev, userName]);
    setJoinedUsers((prev) => [...prev, userEmail]);
  };

  const peers = useMemo(() => ({}), []);

  const createOffer = async (userId) => {
    if (!peers[userId]) return null;
    const offer = await peers[userId].createOffer();
    await peers[userId].setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (userId, offer) => {
    if (!peers[userId]) return null;
    await peers[userId].setRemoteDescription(offer);
    const answer = await peers[userId].createAnswer();
    await peers[userId].setLocalDescription(answer);
    return answer;
  };

  const setRemoteAns = async (userId, ans) => {
    await peers[userId].setRemoteDescription(ans);
  };

  const sendStream = async (userId, stream) => {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      peers[userId].addTrack(track, stream);
    }
  };

  const handleTrackEvent = useCallback((userId, ev) => {
    const streams = ev.streams;
    setRemoteStreams((prev) => ({
      ...prev,
      [userId]: streams[0],
    }));
  }, []);

  useEffect(() => {
    for (const userId in peers) {
      peers[userId].addEventListener("track", (ev) =>
        handleTrackEvent(userId, ev)
      );
    }

    return () => {
      for (const userId in peers) {
        peers[userId].removeEventListener("track", (ev) =>
          handleTrackEvent(userId, ev)
        );
      }
    };
  }, [peers, handleTrackEvent]);

  // Refs for video elements
  const screenShareRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const videoRef = useRef(null);

  return (
    <PeerContext.Provider
      value={{
        peers,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
        remoteStreams,
        updateUser,
        joinedUsers,
        screenShareRef,
        remoteStreamRef,
        videoRef,
        userNames,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
